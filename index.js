const Janus = require('./janus.class')

const sdp = { type: "offer", sdp: "v=0\r\no=mozilla...THIS_IS_SDPARTA-86.0 1556586315901254133 0 IN IP4 0.0.0.0\r\ns=-\r\nt=0 0\r\na=fingerprint:sha-256 38:F1:96:67:73:50:E9:34:EA:87:36:54:68:33:87:F0:4E:09:8D:11:5D:42:4D:8C:6B:62:54:9B:30:C4:A4:17\r\na=group:BUNDLE 0 1\r\na=ice-options:trickle\r\na=msid-semantic:WMS *\r\nm=video 9 UDP/TLS/RTP/SAVPF 120 124 121 125 126 127 97 98\r\nc=IN IP4 0.0.0.0\r\na=sendrecv\r\na=extmap:3 urn:ietf:params:rtp-hdrext:sdes:mid\r\na=extmap:4 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r\na=extmap:5 urn:ietf:params:rtp-hdrext:toffset\r\na=extmap:6/recvonly http://www.webrtc.org/experiments/rtp-hdrext/playout-delay\r\na=extmap:7 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r\na=fmtp:126 profile-level-id=42e01f;level-asymmetry-allowed=1;packetization-mode=1\r\na=fmtp:97 profile-level-id=42e01f;level-asymmetry-allowed=1\r\na=fmtp:120 max-fs=12288;max-fr=60\r\na=fmtp:124 apt=120\r\na=fmtp:121 max-fs=12288;max-fr=60\r\na=fmtp:125 apt=121\r\na=fmtp:127 apt=126\r\na=fmtp:98 apt=97\r\na=ice-pwd:9e94a539fcb3d3fca8bfe84e6876acd3\r\na=ice-ufrag:39eee73a\r\na=mid:0\r\na=msid:{6dac23d2-8936-ea4c-a113-c482a6e71608} {ace1d628-9289-754c-8625-74dd44d6cb20}\r\na=rtcp-fb:120 nack\r\na=rtcp-fb:120 nack pli\r\na=rtcp-fb:120 ccm fir\r\na=rtcp-fb:120 goog-remb\r\na=rtcp-fb:120 transport-cc\r\na=rtcp-fb:121 nack\r\na=rtcp-fb:121 nack pli\r\na=rtcp-fb:121 ccm fir\r\na=rtcp-fb:121 goog-remb\r\na=rtcp-fb:121 transport-cc\r\na=rtcp-fb:126 nack\r\na=rtcp-fb:126 nack pli\r\na=rtcp-fb:126 ccm fir\r\na=rtcp-fb:126 goog-remb\r\na=rtcp-fb:126 transport-cc\r\na=rtcp-fb:97 nack\r\na=rtcp-fb:97 nack pli\r\na=rtcp-fb:97 ccm fir\r\na=rtcp-fb:97 goog-remb\r\na=rtcp-fb:97 transport-cc\r\na=rtcp-mux\r\na=rtcp-rsize\r\na=rtpmap:120 VP8/90000\r\na=rtpmap:124 rtx/90000\r\na=rtpmap:121 VP9/90000\r\na=rtpmap:125 rtx/90000\r\na=rtpmap:126 H264/90000\r\na=rtpmap:127 rtx/90000\r\na=rtpmap:97 H264/90000\r\na=rtpmap:98 rtx/90000\r\na=setup:actpass\r\na=ssrc:359166818 cname:{7dcf03b8-6eb8-624e-a5a1-53d5c92d12bd}\r\na=ssrc:548086473 cname:{7dcf03b8-6eb8-624e-a5a1-53d5c92d12bd}\r\na=ssrc-group:FID 359166818 548086473\r\nm=audio 9 UDP/TLS/RTP/SAVPF 109 9 0 8 101\r\nc=IN IP4 0.0.0.0\r\na=sendrecv\r\na=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r\na=extmap:2/recvonly urn:ietf:params:rtp-hdrext:csrc-audio-level\r\na=extmap:3 urn:ietf:params:rtp-hdrext:sdes:mid\r\na=fmtp:109 maxplaybackrate=48000;stereo=1;useinbandfec=1\r\na=fmtp:101 0-15\r\na=ice-pwd:9e94a539fcb3d3fca8bfe84e6876acd3\r\na=ice-ufrag:39eee73a\r\na=mid:1\r\na=msid:{6dac23d2-8936-ea4c-a113-c482a6e71608} {2e8d03a9-9160-324a-ba0f-da05f3da0bac}\r\na=rtcp-mux\r\na=rtpmap:109 opus/48000/2\r\na=rtpmap:9 G722/8000/1\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:8 PCMA/8000\r\na=rtpmap:101 telephone-event/8000/1\r\na=setup:actpass\r\na=ssrc:573753348 cname:{7dcf03b8-6eb8-624e-a5a1-53d5c92d12bd}\r\n" }



const janusPool = {
    pool: [],

    append(janus) {
        const exist = this.pool.find(x => x.ip === janus.ip && x.port === janus.port)
        if(exist) {
            console.log('Janus already exist in pool')
        }else{
            this.pool.push(janus)
        }
    }
}

module.exports

;(async()=>{
    const j = new Janus({
        ip: '206.189.109.201',
        port: '8088'
    })
    await j.init()

    janusPool.append(j)
    //console.log(janusPool.pool[0])

    await j.createRoom(898989)
    const exist = await j.exist(898989)

    const list = await j.list()

    await j.join(898989)
    const answer = await j.publish({
        "jsep" : sdp
    })
    //console.log(answer)

    await j.trickle()

    if(exist){
        await j.deleteRoom(898989)
    }

   console.log('oo')
    //await j.delete()
})()
