const express = require('express');
const app = express()
const path = require('path')    
const bodyparser = require('body-parser');


app.use(express.static(__dirname + "/public"))
app.use('/build/', express.static(path.join(__dirname, 'node_modules/three/build')))
app.use('/jsm/', express.static(path.join(__dirname, 'node_modules/three/examples/jsm')))
app.use(bodyparser.urlencoded({extended: false}))
app.use(bodyparser.json())

app.listen(4000, () => {
    console.log('le server est lancer avec success')
})
