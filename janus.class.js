const got = require('got')
const { v4: uuidv4 } = require('uuid')

const URL_HTTP_JANUS_PREFIX = "http://"
const URL_HTTP_JANUS_SUFIX = "/janus/"
const event = require('./event')

const janusHttpTransportApi = {
    getTransaction() {
        return uuidv4()
    },
    buildUrl(host, path) {
        return URL_HTTP_JANUS_PREFIX+host+URL_HTTP_JANUS_SUFIX+path
    },
    async post(host, path, payload) {
        const url = this.buildUrl(host, path)
        if(!payload.transaction) {
            payload.transaction = this.getTransaction()
        }
        const {body} = await got.post(url, {
            json: payload,
            responseType: 'json'
        })
        return body
    },
    async get(host, path) {
        const url = this.buildUrl(host, path)
        const {body} = await got.get(url)
        return JSON.parse(body)
    }
}

module.exports = class {
    constructor(payload) {
        this.host = payload.ip+':'+payload.port
        this.session = null                     // Janus Session id
        this.handler = null                     // Janus plugin handler id (videoroom)
    }

    /* Private */

    async createSession() {
        const path = ""
        const result = await janusHttpTransportApi.post(this.host, path, {
            "janus" : "create"
        })
        if(!result.janus === "success" || ! result.data) {
            console.log('Err init janus')
            return false
        }else{
            this.session = result.data.id
        }
        return true
    }

    async createHandler() {
        const path = this.session+"/"
        const result = await janusHttpTransportApi.post(this.host, path, {
            "janus" : "attach",
            "plugin" : "janus.plugin.videoroom"
        })
        if(!result.janus === "success" || ! result.data) {
            console.log('Err handler janus')
            return false
        }else{
            this.handler = result.data.id
        }
        return true
    }

    async destroySession() {
        const path = this.session+"/"
        const result = await janusHttpTransportApi.post(this.host, path,         {
            "janus" : "destroy"
        })
        if(!result.janus === "success") {
            console.log('Err destroying janus session')
            return false
        }else{
            this.session = null
        }
        return true
    }

    async runner() {
        while(1) {
            const path = this.session
            let result
            try{
                result = await janusHttpTransportApi.get(this.host, path)
            }catch(_){
                console.log('Err polling janus videoRoom')
                continue
            }
            if(!result || !result.janus === "success") {
                console.log('Err polling janus videoRoom')
                continue
            }
            if(result.plugindata) {
                event.call(result.transaction, result)
            }
        }
    }

    /* Public */

    async init() {
        if(this.session) {
            console.log('Janus is already initiated')
            return
        }else{
            if(!await this.createSession()) return
            if(!await this.createHandler()) return
            this.runner()                               /* Consume events */
        }
    }

    async delete() {
        if(!this.session) {
            console.log('Janus is not initiated')
            return
        }else{
            if(!await this.destroySession()) return
        }
        return true
    }

    async createRoom(room, payload) {
        payload = payload || {}
        const path = this.session+"/"+this.handler
        const result = await janusHttpTransportApi.post(this.host, path, {
            "janus" : "message",
            "body" : {
                "request" : "create",
                "room" : room,
                "permanent" : payload.permanent,
                "description" : payload.description,
                "secret" : payload.secret,
                "pin" : payload.pin,
                "is_private" : payload.is_private,
                "allowed" : payload.allowed
            }
        })
        if(!result.janus === "success") {
            console.log('Err creating janus videoRoom')
            return false
        }
        return true
    }

    async deleteRoom(room, payload) {
        payload = payload || {}
        const path = this.session+"/"+this.handler
        const result = await janusHttpTransportApi.post(this.host, path, {
            "janus" : "message",
            "body" : {
                "request" : "destroy",
                "room" : room,
                "secret" : payload.secret,
                "permanent" : payload.permanent
            }
        })
        if(!result.janus === "success") {
            console.log('Err deleting janus videoRoom')
            return false
        }
        return true
    }

    async exist(room) {
        const path = this.session+"/"+this.handler
        const result = await janusHttpTransportApi.post(this.host, path, {
            "janus" : "message",
            "body" : {
                "request" : "exists",
                "room" : room
            }
        })
        if(!result.janus === "success") {
            console.log('Err deleting janus videoRoom')
            return false
        }
        return result.plugindata.data.exists
    }

    async list() {
        const path = this.session+"/"+this.handler
        const result = await janusHttpTransportApi.post(this.host, path, {
            "janus" : "message",
            "body" : {
                "request" : "list"
            }
        })
        if(!result.janus === "success") {
            console.log('Err listing janus videoRoom')
            return false
        }
        return result.plugindata.data.list
    }

    async join(room, payload) {
        payload = payload || {}
        const path = this.session+"/"+this.handler
        const transaction = janusHttpTransportApi.getTransaction()
        const promise = new Promise((resolve, reject)=>{
            event.add(transaction, resolve)
        })
        const result = await janusHttpTransportApi.post(this.host, path, {
            "transaction": transaction,
            "janus" : "message",
            "body" : {
                "request" : "join",
                "ptype" : "publisher",
                "room" : room,
                "id" : 45678,
                "display" : payload.display,
                "token" : payload.token
            }
        })
        if(!result.janus === "success") {
            console.log('Err publishing on janus videoRoom')
            return false
        }
        const data = await promise
        return data
    }

    async publish(payload) {
        payload = payload || {}
        const path = this.session+"/"+this.handler
        const transaction = janusHttpTransportApi.getTransaction()
        const promise = new Promise((resolve, reject)=>{
            event.add(transaction, resolve)
        })
        const result = await janusHttpTransportApi.post(this.host, path, {
            "transaction": transaction,
            "janus" : "message",
            "body" : {
                "request" : "publish",
                "audio" : payload.audio,
                "video" : payload.video,
                "data" : payload.data,
                "audiocodec" : payload.audiocodec,
                "videocodec" : payload.videocodec,
                "bitrate" : payload.bitrate,
                "record" : payload.record,
                "filename" : payload.filename,
                "display" : payload.display,
                "audio_level_average" : payload.audio_level_average,
                "audio_active_packets" : payload.audio_active_packets
            },
            "jsep": payload.jsep
        })
        if(!result.janus === "success") {
            console.log('Err publishing on janus videoRoom')
            return false
        }
        const data = await promise
        if(data.jsep && data.jsep.sdp) {
            return data.jsep.sdp
        }else{
            console.log('Err publishing on janus videoRoom')
            return false
        }
    }

    async trickle(room, payload) {
        payload = payload || {}
        const path = this.session+"/"+this.handler
        const result = await janusHttpTransportApi.post(this.host, path, {
            "janus" : "trickle",
            "candidate" : {
                "completed" : true
            }
        })
        if(!result.janus === "success") {
            console.log('Err trickle on janus videoRoom')
            return false
        }
        return true
    }
}
