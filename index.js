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

const Handler = class {
    constructor(janus, handler) {
        this.janus = janus
        this.handler = handler
        this.type = null
        this.room = null
    }

    /* Private */

    async joinPublisher(room, payload) {
        payload = payload || {}
        const path = this.janus.session+"/"+this.handler
        const transaction = janusHttpTransportApi.getTransaction()
        const promise = new Promise((resolve, reject)=>{
            event.add(transaction, resolve)
        })
        const result = await janusHttpTransportApi.post(this.janus.host, path, {
            "transaction": transaction,
            "janus" : "message",
            "body" : {
                "request" : "join",
                "ptype" : "publisher",
                "room" : room,
                "id" : payload.id,
                "display" : payload.display,
                "token" : payload.token
            }
        })
        if(!result.janus === "success") {
            console.log('Err publishing on janus videoRoom')
            return false
        }
        const data = await promise
        this.type = "publisher"
        this.room = room
        return data
    }

    async joinSubscriber(room, feed, payload) {
        payload = payload || {}
        const path = this.janus.session+"/"+this.handler
        const transaction = janusHttpTransportApi.getTransaction()
        const promise = new Promise((resolve, reject)=>{
            event.add(transaction, resolve)
        })
        const result = await janusHttpTransportApi.post(this.janus.host, path, {
            "transaction": transaction,
            "janus" : "message",
            "body" : {
                "request" : "join",
                "ptype" : "subscriber",
                "room" : room,
                "feed" : feed,
                "private_id" : payload.private_id,
                "close_pc" : payload.close_pc,
                "audio" : payload.audio,
                "video" : payload.video,
                "data" : payload.data,
                "offer_audio" : payload.offer_audio,
                "offer_video" : payload.offer_video,
                "offer_data" :  payload.offer_data,
                "substream" :  payload.substream,
                "temporal" :  payload.temporal,
                "fallback" :  payload.fallback,
                "spatial_layer" : payload.spatial_layer,
                "temporal_layer" : payload.temporal_layer,
            }
        })
        if(!result.janus === "ack") {
            console.log('Err watching on janus videoRoom')
            return false
        }
        const data = await promise
        this.type = "subscriber"
        this.room = room
        if(data.jsep && data.jsep.sdp) {
            return data.jsep.sdp
        }else{
            console.log('Err watching on janus videoRoom')
            return false
        }
    }

    async publish(payload) {
        payload = payload || {}
        const path = this.janus.session+"/"+this.handler
        const transaction = janusHttpTransportApi.getTransaction()
        const promise = new Promise((resolve, reject)=>{
            event.add(transaction, resolve)
        })
        const result = await janusHttpTransportApi.post(this.janus.host, path, {
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

    async answer(payload) {
        payload = payload || {}
        const path = this.janus.session+"/"+this.handler
        const transaction = janusHttpTransportApi.getTransaction()
        const promise = new Promise((resolve, reject)=>{
            event.add(transaction, resolve)
        })
        const result = await janusHttpTransportApi.post(this.janus.host, path, {
            "transaction": transaction,
            "janus" : "message",
            "body" : {
                "request" : "start"
            },
            "jsep": payload.jsep
        })
        if(!result.janus === "success") {
            console.log('Err publishing on janus videoRoom')
            return false
        }
        const data = await promise
        if(data.plugindata && data.plugindata.data && data.plugindata.data.started) {
            return true
        }else{
            console.log('Err publishing on janus videoRoom')
            return false
        }
    }

    async trickle(room, payload) {
        payload = payload || {}
        const path = this.janus.session+"/"+this.handler
        const result = await janusHttpTransportApi.post(this.janus.host, path, {
            "janus" : "trickle",
            "candidate" : payload.ice
        })
        if(!result.janus === "success") {
            console.log('Err trickle on janus videoRoom')
            return false
        }
        return true
    }
}

module.exports = class {
    constructor(payload) {
        this.host = payload.ip+':'+payload.port
        this.session = null                     // Janus Session id
        this.handlers = []                      // Janus plugin handler's id (videoroom)
        this.handler = null
    }

    /* Private */

    async #createSession() {
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

    async #createHandler() {
        const path = this.session+"/"
        const result = await janusHttpTransportApi.post(this.host, path, {
            "janus" : "attach",
            "plugin" : "janus.plugin.videoroom"
        })
        if(!result.janus === "success" || ! result.data) {
            console.log('Err handler janus')
            return false
        }
        const handler = new Handler(this, result.data.id)
        this.handlers.push(handler)
        return handler
    }

    async #destroySession() {
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

    async #runner() {
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

    async getFeeds(room) {
        const path = this.session+"/"+this.handler
        const result = await janusHttpTransportApi.post(this.host, path, {
            "janus" : "message",
            "body" : {
                "request" : "listparticipants",
                "room" : room
            }
        })
        if(!result.janus === "success") {
            console.log('Err getFeeds on janus videoRoom')
            return false
        }
        return result.plugindata.data.participants
    }

    /* Public */

    async init() {
        if(this.session) {
            console.log('Janus is already initiated')
            return
        }else{
            if(!await this.#createSession()) return
            this.handler = (await this.#createHandler()).handler
            this.#runner()                               /* Consume events */
        }
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
            console.log('Err exist check janus videoRoom')
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

    async delete() {
        if(!this.session) {
            console.log('Janus is not initiated')
            return
        }else{
            if(!await this.#destroySession()) return
        }
        return true
    }

    async getOnStage(room, payload) {
        const publishHandler = await this.#createHandler()
        await publishHandler.joinPublisher(room, payload)
        const answer = await publishHandler.publish(payload)

        return {
            handler: publishHandler,
            answer: answer
        }
    }

    async watch(room, publisherId, payload) {
        const subscribeHandler = await this.#createHandler()
        const offer = await subscribeHandler.joinSubscriber(room, publisherId, payload)
        return {
            handler: subscribeHandler,
            offer: offer
        }
    }
}
