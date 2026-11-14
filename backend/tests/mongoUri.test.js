const { isLocalMongoUri, describeMongoHosts } = require('../utils/mongoUri');

describe('isLocalMongoUri', () => {
    test.each([
        'mongodb://localhost:27017/db',
        'mongodb://127.0.0.1:61234/',
        'mongodb://user:pw@localhost/db?authSource=admin',
        'mongodb://[::1]:27017/db'
    ])('%s is local', uri => {
        expect(isLocalMongoUri(uri)).toBe(true);
    });

    test.each([
        'mongodb+srv://u:p@cluster0.abcd.mongodb.net/db',
        'mongodb://db.example.com:27017/db',
        'mongodb://localhost:27017,db.example.com:27017/db',
        '',
        undefined
    ])('%p is not local', uri => {
        expect(isLocalMongoUri(uri)).toBe(false);
    });
});

describe('describeMongoHosts', () => {
    test('never includes the credentials', () => {
        expect(describeMongoHosts('mongodb+srv://u:secret@cluster0.abcd.mongodb.net/db')).toBe('cluster0.abcd.mongodb.net');
    });

    test('never includes a password that contains / or ?', () => {
        expect(describeMongoHosts('mongodb+srv://u:pa/ss?x@cluster0.abcd.mongodb.net/db')).toBe('cluster0.abcd.mongodb.net');
        expect(isLocalMongoUri('mongodb://u:pa/ss@db.example.com/db')).toBe(false);
    });
});
