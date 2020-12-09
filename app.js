const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use('/static', express.static(__dirname + '/public'));

app.use('/api/v1', require('./api/v1/info'));

app.listen(port, () =>{
    console.log(`server is running at localhost:${port}`);
});
