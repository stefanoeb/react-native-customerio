const axios = require('axios').default;
const { Base64 } = require('js-base64');
const TIMEOUT = 10000;

class Request {
  constructor(auth, defaults) {
    if (typeof auth === 'object') {
      this.apikey = auth.apikey;
      this.siteid = auth.siteid;

      this.auth = `Basic ${Base64.encode(`${this.siteid}:${this.apikey}`)}`;
    } else {
      this.appKey = auth;
      this.auth = `Bearer ${this.appKey}`;
    }

    this.defaults = Object.assign(
      {
        timeout: TIMEOUT,
      },
      defaults,
    );
    this._axios = axios.create(this.defaults);
  }

  options(url, method, data) {
    const headers = {
      Authorization: this.auth,
      'Content-Type': 'application/json',
    };

    const options = { method, url, headers, data };
    return options;
  }

  handler(options) {
    return new Promise((resolve, reject) => {
      this._axios(options)
        .then((response) => {
          if (response.status == 200 || response.status == 201) {
            resolve(response.data);
          } else {
            reject({
              message: response.statusText || 'Unknown error',
              statusCode: response.status,
              response: response,
              body: response.data,
            });
          }
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  put(url, data = {}) {
    return this.handler(this.options(url, 'PUT', data));
  }

  destroy(url) {
    return this.handler(this.options(url, 'DELETE'));
  }

  post(url, data = {}) {
    return this.handler(this.options(url, 'POST', data));
  }
}

module.exports = Request;
