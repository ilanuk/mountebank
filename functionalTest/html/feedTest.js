'use strict';

const assert = require('assert'),
    promiseIt = require('../testHelpers').promiseIt,
    api = require('../api/api').create(),
    httpClient = require('../api/http/baseHttpClient').create('http'),
    xpath = require('xpath'),
    DOMParser = require('xmldom').DOMParser;

const entryCount = body => {
    const doc = new DOMParser().parseFromString(body),
        select = xpath.useNamespaces({ atom: 'http://www.w3.org/2005/Atom' });
    return select('count(//atom:entry)', doc);
};

const getNextLink = body => {
    const doc = new DOMParser().parseFromString(body),
        select = xpath.useNamespaces({ atom: 'http://www.w3.org/2005/Atom' });
    return select('//atom:link[@rel="next"]/@href', doc)[0].value;
};

describe('the feed', () => {
    promiseIt('should default to page 1 with 10 entries', () => httpClient.get('/feed', api.port).then(response => {
        assert.strictEqual(response.statusCode, 200);
        assert.strictEqual(response.headers['content-type'], 'application/atom+xml; charset=utf-8');
        assert.strictEqual(entryCount(response.body), 10);

        return httpClient.get(getNextLink(response.body), api.port);

    }).then(response => {
        assert.strictEqual(response.statusCode, 200);
        assert.ok(entryCount(response.body) > 0, 'No entries');
    }));
});
