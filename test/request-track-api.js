const test = require('ava');
const sinon = require('sinon');
const Request = require('../lib/request');
const { Base64 } = require('js-base64');

// setup & fixture data
const siteId = 123;
const apiKey = 'abc';
const url = 'https://track.customer.io/api/v1/customers/1';
const data = { first_name: 'Bruce', last_name: 'Wayne' };
const auth = `Basic ${Base64.encode(`${siteId}:${apiKey}`)}`;
const baseOptions = {
  url,
  headers: {
    Authorization: auth,
    'Content-Type': 'application/json',
  },
  data: undefined,
};

test.beforeEach((t) => {
  t.context.req = new Request({ siteid: 123, apikey: 'abc' }, { timeout: 5000 });
});

// tests begin here
test('constructor sets all properties correctly', (t) => {
  t.is(t.context.req.siteid, 123);
  t.is(t.context.req.apikey, 'abc');
  t.deepEqual(t.context.req.defaults, { timeout: 5000 });
  t.is(t.context.req.auth, auth);
});

test('constructor sets default timeout correctly', (t) => {
  const req = new Request();
  t.deepEqual(req.defaults, { timeout: 10000 });
});

test('#options returns a correctly formatted object', (t) => {
  const expectedOptions = Object.assign(baseOptions, { method: 'POST' });
  const resultOptions = t.context.req.options(url, 'POST');

  t.deepEqual(resultOptions, expectedOptions);
});

const putOptions = Object.assign({}, baseOptions, {
  method: 'PUT',
  data: JSON.stringify(data),
});

test('#handler returns a promise', (t) => {
  const promise = t.context.req.handler(putOptions);
  t.context.req._axios = () => {};
  t.is(promise.constructor.name, 'Promise');
});

test('#handler makes a request and resolves a promise on success', (t) => {
  const data = {};
  t.context.req._axios = (options) => {
    return new Promise((resolve) => {
      resolve({ status: 200, data: data });
    });
  };
  return t.context.req.handler(putOptions).then((res) => t.deepEqual(res, data));
});

test('#handler makes a request and rejects with an error on failure', (t) => {
  const customOptions = Object.assign({}, baseOptions, {
    url: 'https://track.customer.io/api/v1/customers/1/events',
    data: JSON.stringify({ title: 'The Batman' }),
  });

  const message = 'test error message';
  const data = { statusText: message };

  t.context.req._axios = (options) => {
    return new Promise((resolve) => {
      resolve({ status: 400, statusText: message, data: data });
    });
  };

  return t.context.req.handler(customOptions).catch((err) => t.is(err.message, message));
});

test('#handler makes a request and rejects with timeout error', (t) => {
  const message = 'test error message';
  const data = { meta: { error: message } };
  const customOptions = Object.assign({}, baseOptions, {
    method: 'PUT',
    data: JSON.stringify(data),
    timeout: 1,
  });
  return t.context.req
    .handler(customOptions)
    .then(t.fail)
    .catch((err) => t.is(err.message, 'timeout of 1ms exceeded'));
});

test('#put returns the promise generated by the handler', (t) => {
  const promise = t.context.req.put(url, data);
  t.is(promise.constructor.name, 'Promise');
});

const deleteOptions = Object.assign({}, baseOptions, { method: 'DELETE' });

test('#destroy calls the handler, makes a DELETE request with the correct args', (t) => {
  sinon.stub(t.context.req, 'handler');
  t.context.req.destroy(url);
  t.truthy(t.context.req.handler.calledWith(deleteOptions));
});

test('#destroy returns the promise generated by the handler', (t) => {
  const promise = t.context.req.destroy(url);
  t.is(promise.constructor.name, 'Promise');
});

const postOptions = Object.assign({}, baseOptions, {
  method: 'POST',
  data: JSON.stringify(data),
});

test('#post returns the promise generated by the handler', (t) => {
  const promise = t.context.req.post(url);
  t.is(promise.constructor.name, 'Promise');
});
