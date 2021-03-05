const Janus = require('./janus.class')



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
    console.log(await j.exist(898989))
    await j.createRoom(898989)
    console.log(await j.exist(898989))
    //const list = await j.list()


    /*
    await j.join(898989)

    process.stdin.resume()
    async function exitHandler(options, exitCode) {
        console.log('end')
        await j.deleteRoom(898989)
        process.abort()
    }
    process.on('exit', exitHandler.bind(null,{cleanup:true}));
    process.on('SIGINT', exitHandler.bind(null, {exit:true}));
    
    

    let oooo = false


    const WebSocket = require('ws')
    const wss = new WebSocket.Server({ port: 8080 })
    
    wss.on('connection', function connection(ws) {
      ws.on('message', async function incoming(message) {
    
    
        const data = JSON.parse(message)


            if(data.sdp) {
                console.log('GOT SDP')
                const answer = await j.publish({
                    "jsep" : {
                        type: "offer",
                        sdp: data.sdp
                    }
                })
                console.log('sending answer')
                ws.send(JSON.stringify({
                    answer: answer
                }))
            }

            if(data.ice) {
                console.log('GOT ICE')
                await j.trickle(898989, data.ice)
            }






      })
    })
    



    setInterval(async()=>{
        const feeds = await j.getFeeds(898989)
        console.log(feeds)
        if(!oooo && feeds[0] && feeds[0].publisher){
            oooo = true

            const a = new Janus({
                ip: '206.189.109.201',
                port: '8088'
            })
            await a.init()



            const e = await a.watch(898989, 45678, {})
            console.log(e)
        }
    }, 5000)




    //await j.delete()

    */
})()
