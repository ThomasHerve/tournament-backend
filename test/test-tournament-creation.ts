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


function get(url, token) {
  return new Promise((resolve, reject) => {
    const options = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    const req = http.request(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve(data);
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}
  


function test(needUser, reset) {
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
        get('http://localhost:3000/users/profile' , token).then((username)=>console.log("username: " + username))

        // Current tournaments
        get('http://localhost:3000/tournament/all' , token).then((tournaments)=>console.log(`Tournaments before: ${tournaments}`))

        if(reset) {
          get('http://localhost:3000/tournament/all' , token).then((tournaments)=>
           {
            const list = JSON.parse(tournaments); 
            list.forEach(element => {
                    post('http://localhost:3000/tournament/delete' , {
                      id: element["id"]
                  }, token)
            });
           }
          )
        }
        else {
          // Create tournament
          post('http://localhost:3000/tournament/create' , {
            name: "fruits"
          }, token).then((tournament)=>{
            const id = JSON.parse(tournament)["id"];
            // Inserts fruits
            console.log(`id is ${id}`)
            post(`http://localhost:3000/tournament/${id}/insert-entries`,{
              entries: [
                {
                  name: "pomme",
                  link: "pomme"
                },
                {
                  name: "banane",
                  link: "banane"
                },
              ]
            },token).then((entries)=>{})

            post('http://localhost:3000/tournament/create' , {
              name: "test"
            }, token).then((tournament)=>{
              const id2 = JSON.parse(tournament)["id"];
              // Inserts fruits
              post(`http://localhost:3000/tournament/${id2}/insert-entries`,{
                entries: [
                  {
                    name: "test1",
                    link: "test1"
                  },
                  {
                    name: "test2",
                    link: "test2"
                  },
                ]
              },token).then((entries)=>{
                  get(`http://localhost:3000/tournament/${id2}/entries`, false).then(e => console.log(e));
              })
            })
              
          })
        }
    });
}
}

test(true, true);