const LOCAL_HOSTS = ['localhost', '127.0.0.1', '::1', '[::1]'];

const stripPort = host => (host.startsWith('[') ? host.slice(0, host.indexOf(']') + 1) : host.replace(/:\d+$/, ''));

//Hosts of a mongodb:// URI without scheme, credentials, ports, path or query; [] when not a string
const getHosts = uri => {
    if (typeof uri !== 'string') return [];
    //Cut the credentials at the last @ first, so a / or ? inside a password is never taken for the path
    const rest = uri.replace(/^mongodb(\+srv)?:\/\//, '');
    const hostList = rest.slice(rest.lastIndexOf('@') + 1).split(/[/?]/)[0];
    return hostList.split(',').map(stripPort);
};

//True only when every host is this machine. mongodb+srv:// is always remote.
exports.isLocalMongoUri = uri => {
    if (typeof uri !== 'string' || uri.startsWith('mongodb+srv://')) return false;
    return getHosts(uri).every(host => LOCAL_HOSTS.includes(host));
};

//Host part only, safe to print (never the credentials)
exports.describeMongoHosts = uri => getHosts(uri).join(',') || 'unknown host';
