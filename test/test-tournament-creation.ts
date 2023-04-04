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
                  if(element.name === "fruits") {
                    post('http://localhost:3000/tournament/delete' , {
                      id: element["id"]
                  }, token)
                  } 
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
                  link: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRWfVdZ_LdFxj14d4t4zVslVvV9jOWtT_2_7lm0yCH_Kw&s"
                },
                {
                  name: "banane",
                  link: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4QBzRXhpZgAASUkqAAgAAAABAA4BAgBRAAAAGgAAAAAAAABUd28gcmlwZSBiYW5hbmFzLCBhbmQgY3V0IGEgcGllY2Ugb2YgcGVlbGVkIGJhbmFuYSBvbiB3aGl0ZSBiYWNrZ3JvdW5kLCBpc29sYXRlZC7/7QCiUGhvdG9zaG9wIDMuMAA4QklNBAQAAAAAAIYcAlAADklubmEgVGFyYXNlbmtvHAJ4AFFUd28gcmlwZSBiYW5hbmFzLCBhbmQgY3V0IGEgcGllY2Ugb2YgcGVlbGVkIGJhbmFuYSBvbiB3aGl0ZSBiYWNrZ3JvdW5kLCBpc29sYXRlZC4cAm4AGEdldHR5IEltYWdlcy9pU3RvY2twaG90b//hAzhodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvAAk8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgoJCTxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1sbnM6SXB0YzR4bXBDb3JlPSJodHRwOi8vaXB0Yy5vcmcvc3RkL0lwdGM0eG1wQ29yZS8xLjAveG1sbnMvIiB4bWxuczpHZXR0eUltYWdlc0dJRlQ9Imh0dHA6Ly94bXAuZ2V0dHlpbWFnZXMuY29tL2dpZnQvMS4wLyIgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIiB4bWxuczpwbHVzPSJodHRwOi8vbnMudXNlcGx1cy5vcmcvbGRmL3htcC8xLjAvIiB4bWxuczppcHRjRXh0PSJodHRwOi8vaXB0Yy5vcmcvc3RkL0lwdGM0eG1wRXh0LzIwMDgtMDItMjkvIiBwaG90b3Nob3A6Q3JlZGl0PSJHZXR0eSBJbWFnZXMvaVN0b2NrcGhvdG8iIEdldHR5SW1hZ2VzR0lGVDpBc3NldElEPSIxMTI2Njk1NjkzIiA+CjxkYzpjcmVhdG9yPjxyZGY6U2VxPjxyZGY6bGk+SW5uYSBUYXJhc2Vua288L3JkZjpsaT48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"
                },
              ]
            },token).then((entries)=>{
                console.log(entries)
            })

          })
        }
    });
}
}

test(false, true);