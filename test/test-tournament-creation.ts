const http = require('http');

// utils
function post(url, data, token) {
    const dataString = JSON.stringify(data)
    let header = {}
    if(token) {
        header = {
            'Content-Type': 'application/json',
            'Content-Length': dataString.length,
            Authorization: 'Bearer ' + token
        }
    } else {
        header = {
            'Content-Type': 'application/json',
            'Content-Length': dataString.length,
        }
    }

    const options = {
      method: 'POST',
      headers: header,
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
    }, false).then((res)=>{
        console.log("Create account: " + res)
    });
}
else {
    post("http://localhost:3000/users/login", {
        username: "test",
        password: "testtest",
    }, false).then((res)=>{
        const token = JSON.parse(res)["access_token"];
        // We are logged
        console.log("Logged: " + token)
        // Get Username
        http.get(
             'http://localhost:3000/users/profile'  
        , (username)=>console.log("username: " + username));
    });
}


