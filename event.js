module.exports = {
    listeners: [],

    add(txId, resolve) {
        this.listeners.push({
            txId: txId,
            resolve: resolve
        })
    },

    call(txId, d) {
        console.log(d)
        const listener = this.listeners.find(x => x.txId === txId)
        if(listener) {
            listener.resolve(d)
            const index = this.listeners.indexOf(listener)
            if (index !== -1) {
                this.listeners.splice(index, 1)
            }
        }
    }
}
