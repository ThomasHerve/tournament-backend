const http = require('http');

// utils
function post(url, data) {
    const dataString = JSON.stringify(data)
  
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': dataString.length,
      },
      timeout: 1000, // in ms
    }
  
    return new Promise((resolve, reject) => {
      const req = http.request(url, options, (res) => {
        if (res.statusCode < 200 || res.statusCode > 299) {
          return reject(new Error(`HTTP status code ${res.statusCode}`))
        }
  
        const body = []
        res.on('data', (chunk) => body.push(chunk))
        res.on('end', () => {
          const resString = Buffer.concat(body).toString()
          resolve(resString)
        })
      })
  
      req.on('error', (err) => {
        reject(err)
      })
  
      req.on('timeout', () => {
        req.destroy()
        reject(new Error('Request time out'))
      })
  
      req.write(dataString)
      req.end()
    })
  }
  
const needUser = false;


if(needUser) {
    // Create account
    post("http://localhost:3000/users/create", {
        username: "test",
        password: "testtest",
        email: "test@test.com"
    }).then((res)=>{
        console.log("Create account: " + res)
    });
}


