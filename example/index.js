const Janus = require('..')

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

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

module.exports

;(async()=>{
    const j = new Janus({
        ip: '206.189.109.201',
        port: '8088'
    })
    await j.init()
    console.log(await j.exist(898989))
    await j.createRoom(898989)
    console.log(await j.exist(898989))

    process.stdin.resume()
    async function exitHandler(options, exitCode) {
        console.log('end')
        await j.deleteRoom(898989)
        process.abort()
    }
    process.on('exit', exitHandler.bind(null,{cleanup:true}));
    process.on('SIGINT', exitHandler.bind(null, {exit:true}));
    
    let publisher = null
    let subscriber = null
    let oooo = false
    const WebSocket = require('ws')
    const wss = new WebSocket.Server({ port: 8080 })
    
    wss.on('connection', function connection(ws) {
      ws.on('message', async function incoming(message) {
        const data = JSON.parse(message)
            if(data.sdp) {
                console.log('GOT SDP')

                setInterval(async()=>{
                    const feeds = await j.getFeeds(898989)
                    console.log(feeds)
                    if(!oooo && feeds[0] && feeds[0].publisher){
                        oooo = true

                        console.log('ty67')
            
                        const result = await j.watch(898989, feeds[0].id, {})
                        console.log('WATCH OK')
                        subscriber = result.handler
                        ws.send(JSON.stringify({
                            offer: result.offer
                        }))
                    }
                }, 5000)

                result = await j.getOnStage(898989, {
                    "jsep" : {
                        type: "offer",
                        sdp: data.sdp
                    }
                })
                publisher = result.handler
                console.log(result)
                console.log('sending answer')
                ws.send(JSON.stringify({
                    answer: result.answer
                }))
            }

            if(data.ice) {
                console.log('GOT ICE')
                while(!publisher) {
                    await sleep(1000)
                }
                await publisher.trickle(data.ice)
            }

            if(data.answer) {
                console.log('answer')
                while(!subscriber) {
                    await sleep(1000)
                }
                console.log('oooo345678')
                console.log(data)
                await subscriber.answer({
                    "jsep" : {
                        type: "answer",
                        sdp: data.answer
                    }
                })
            }
      })
    })

    //await j.delete()
})()
