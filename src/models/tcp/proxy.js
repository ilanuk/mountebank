'use strict';

var net = require('net'),
    Q = require('q'),
    logger = require('winston'),
    util = require('util'),
    errors = require('../../errors/errors');

function socketName (socket) {
    return socket.host + ':' + socket.port;
}

function create () {
    function to (options, originalRequest) {
        var deferred = Q.defer(),
            socket = net.connect(options, function () {
                socket.end(originalRequest.data, 'utf8');
            });

        logger.info(util.format('Proxying %s => %s => %s',
            socketName(originalRequest), originalRequest.data, socketName(options)));

        socket.setEncoding('utf8');
        socket.on('data', function (data) {
            logger.info(util.format('%s <= %s', data, socketName(options)));
            deferred.resolve({ data: data });
        });

        socket.on('error', function (error) {
            if (error.code === 'ENOTFOUND') {
                deferred.reject(errors.InvalidProxyError('Cannot resolve ' + JSON.stringify(options)));
            }
            else if (error.code === 'ECONNREFUSED') {
                deferred.reject(errors.InvalidProxyError('Unable to connect to ' + JSON.stringify(options)));
            }
            else {
                deferred.reject(error);
            }
        });

        return deferred.promise;
    }

    return {
        to: to
    };
}

module.exports = {
    create: create
};