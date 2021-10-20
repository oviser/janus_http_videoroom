const got = require('got')
const { v4: uuidv4 } = require('uuid')
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

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
    async post(host, path, payload, secret) {
        const url = this.buildUrl(host, path)
        if(!payload.transaction) {
            payload.transaction = this.getTransaction()
        }
        payload.apisecret = secret
        const {body} = await got.post(url, {
            json: payload,
            responseType: 'json'
        })
        return body
    },
    async get(host, path, secret) {
        const url = this.buildUrl(host, path)+"?apisecret="+secret
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
        this.id = null
    }

    /* Private */

    async joinPublisher(room, payload) {
        payload = payload || {}
        const path = this.janus.session+"/"+this.handler
        const transaction = janusHttpTransportApi.getTransaction()
        const promise = new Promise((resolve, reject)=>{
            event.add(transaction, resolve)
        }, this.janus.secret)
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
        }, this.janus.secret)
        if(!result.janus === "success") {
            console.log('Err publishing on janus videoRoom')
            return false
        }
        console.log(result)
        const data = await promise
        this.id = data.plugindata.data.id
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
        }, this.janus.secret)
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
        }, this.janus.secret)
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
        }, this.janus.secret)
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
        }, this.janus.secret)
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
        }, this.janus.secret)
        const result = await janusHttpTransportApi.post(this.janus.host, path, {
            "transaction": transaction,
            "janus" : "message",
            "body" : {
                "request" : "start"
            },
            "jsep": payload.jsep
        }, this.janus.secret)
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

    async trickle(payload) {
        payload = payload || {}
        const path = this.janus.session+"/"+this.handler
        const result = await janusHttpTransportApi.post(this.janus.host, path, {
            "janus" : "trickle",
            "candidate" : payload.ice
        }, this.janus.secret)
        if(!result.janus === "success") {
            console.log('Err trickle on janus videoRoom')
            return false
        }
        return true
    }

    async unpublish() {
        const path = this.janus.session+"/"+this.handler
        await janusHttpTransportApi.post(this.janus.host, path, {
            "janus" : "message",
            "body" : {
                "request" : "unpublish"
            }
        }, this.janus.secret)
        return true 
    }

    async leave() {
        const path = this.janus.session+"/"+this.handler
        await janusHttpTransportApi.post(this.janus.host, path, {
            "janus" : "message",
            "body" : {
                "request" : "leave"
            }
        }, this.janus.secret)
        return true
    }

    async detach() {
        const path = this.janus.session+"/"+this.handler
        await janusHttpTransportApi.post(this.janus.host, path, {
            "janus" : "detach",
        }, this.janus.secret)
        return true
    }

    async hangup() {
        await this.leave()
        await this.detach()
    }
}

module.exports = class {
    constructor(payload) {
        this.host = payload.host
        this.secret = payload.secret
        this.session = null                     // Janus Session id
        this.handler = null
        this.killed = false
        this.crashed = 0
    }

    /* Private */

    async createSession() {
        const path = ""
        const result = await janusHttpTransportApi.post(this.host, path, {
            "janus" : "create"
        }, this.secret)
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
        }, this.secret)
        if(!result.janus === "success" || ! result.data) {
            console.log('Err handler janus')
            return false
        }
        const handler = new Handler(this, result.data.id)
        return handler
    }

    async destroySession() {
        const path = this.session+"/"
        const result = await janusHttpTransportApi.post(this.host, path, {
            "janus" : "destroy"
        }, this.secret)
        if(!result.janus === "success") {
            console.log('Err destroying janus session')
            return false
        }else{
            this.session = null
        }
        return true 
    }

    async runner() {
        let err = 0
        while(!this.killed) {
            console.log('JANUS WORKER '+this.host)
            if(err >= 2 && this.crashed >= 3) {
                this.destroy(this.host)
                return
            }else if(err >= 2) {
                this.crashed ++
                this.init()
                console.log('Err Janus 2/2. ReInit')
                return
            }else{
                const path = this.session
                let result
                try{
                    result = await janusHttpTransportApi.get(this.host, path, this.secret)
                }catch(_){
                    console.log(_)
                    console.log('Err polling janus videoRoom ['+err+"/2]")
                    err ++
                    await delay(2000)
                    continue
                }
                if(!result || !result.janus === "success") {
                    console.log('Err polling janus videoRoom ['+err+"/2]")
                    err ++
                    await delay(2000)
                    continue
                }
                err = 0
                this.crashed = 0
                if(result.plugindata) {
                    event.call(result.transaction, result)
                }
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
        }, this.secret)
        if(!result.janus === "success") {
            console.log('Err getFeeds on janus videoRoom')
            return false
        }
        return result.plugindata.data.participants
    }

    /* Public */

    async init() {
        let result = null
        try{
            result = await this.createSession()
            if(result) {
                this.handler = (await this.createHandler()).handler
            }
        }catch(_){
            console.log('Janus off #9')
        }
        this.runner()                               /* Consume events */
    }

    async kill() {
        console.log('killed '+this.host)
        this.killed = true
        await this.delete()
    }

    async exist(room) {
        const path = this.session+"/"+this.handler
        const result = await janusHttpTransportApi.post(this.host, path, {
            "janus" : "message",
            "body" : {
                "request" : "exists",
                "room" : room
            }
        }, this.secret)
        if(!result.janus === "success") {
            console.log('Err exist check janus videoRoom')
            return false
        }
        if(!result.plugindata || !result.plugindata.data) {
            throw new Error('Err exist check janus videoRoom')
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
        }, this.secret)
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
                "allowed" : payload.allowed,
                "publishers": payload.publishers,
                "bitrate": payload.bitrate,
                "bitrate_cap": payload.bitrate_cap
            }
        }, this.secret)

        if(!result.janus === "success") {
            console.log('Err creating janus videoRoom')
            return false
        }
        return result.plugindata.data.room
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
        }, this.secret)
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
            if(!await this.destroySession()) return
        }
        return true
    }

    async getOnStage(room, payload) {
        const publishHandler = await this.createHandler()
        await publishHandler.joinPublisher(room, payload)
        const answer = await publishHandler.publish(payload)

        return {
            handler: publishHandler,
            answer: answer
        }
    }

    async watch(room, publisherId, payload) {
        const subscribeHandler = await this.createHandler()
        const offer = await subscribeHandler.joinSubscriber(room, publisherId, payload)
        return {
            handler: subscribeHandler,
            offer: offer
        }
    }

    async rtpForward(room, payload) {
        payload = payload || {}
        const path = this.session+"/"+this.handler
        const result = await janusHttpTransportApi.post(this.host, path, {
            "janus" : "message",
            "body" : {
                "request" : "rtp_forward",
                "room" : room,
                "publisher_id": payload.publisher_id,
                "host": payload.host,
                "host_family": payload.host_family,
                "video_port": payload.video_port,
                "audio_port": payload.audio_port,
                "video_rtcp_port": payload.video_rtcp_port,
                "audio_rtcp_port": payload.audio_rtcp_port
            }
        }, this.secret)
        if(!result.janus === "success") {
            console.log('Err creating janus videoRoom rtpForward')
            return false
        }
        console.log('RTP FORWARD')
        console.log(result.plugindata)
        return true
    }

    async stopRtpForward(room, payload) {
        payload = payload || {}
        const path = this.session+"/"+this.handler
        const result = await janusHttpTransportApi.post(this.host, path, {
            "janus" : "message",
            "body" : {
                "request" : "stop_rtp_forward",
                "room" : room,
                "publisher_id": payload.publisher_id,
                "stream_id": payload.stream_id
            }
        }, this.secret)
        if(!result.janus === "success") {
            console.log('Err stop janus videoRoom rtp forward')
            return false
        }
        console.log(result)
        return true
    }
}
