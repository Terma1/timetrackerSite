const timeTracker = "time-tracker-app-v1"
const assets = [
    "/",
    "/html",
    "/html/apv.html",
    "/html/apz.html",
    "/html/heatmap.html",
    "/html/main.html",
    "/html/settings.html",
    "/html/statistic.html",
    "/html/subject.html",
    "/html/progressBar.html",
    "/scripts/apv.js",
    "/scripts/apz.js",
    "/scripts/heatmap.js",
    "/scripts/main.js",
    "/scripts/settings.js",
    "/scripts/statistic.js",
    "/scripts/backupServer.js",
    "/scripts/global.js",
    "/scripts/subject.js",
    "/scripts/progressBar.js",
    "/images/timer128.png"
    /*,
    */
];

self.addEventListener("install", installEvent => {
    installEvent.waitUntil(
        caches.open(timeTracker).then(cache => {
            cache.addAll(assets).catch(() => {
                console.log("Error by installing the app");
            });
        })
    )
});

self.addEventListener("fetch", fetchEvent => {
    fetchEvent.respondWith(
        caches.match(fetchEvent.request).then(res => {
            return res || fetch(fetchEvent.request)
        })
    )
})



/*
self.addEventListener("install", function(event) {
    event.waitUntil(preLoad());
});



let preLoad = function(){
    console.log("Installing web app");
    return caches.open("offline").then(function(cache) {
        console.log("caching index and important routes");
        return cache.addAll([ "/",
            "/scripts",
            "/images",
            "/html",
            "/styles.css",
            "/css/style.css",
            "/js/app.js",
            "/scripts/apv.js",
            "/scripts/apz.js",
            "/scripts/backupServer.js",
            "/scripts/global.js",
            "/scripts/heatmap.js",
            "/scripts/main.js",
            "/scripts/settings.js",
            "/scripts/statistic.js",
            "/scripts/subject.js",
            "/scripts/verbleibende.js",
            "/images/favicon.png"]);
    });
};

self.addEventListener("fetch", function(event) {
    event.respondWith(checkResponse(event.request).catch(function() {
        return returnFromCache(event.request);
    }));
    event.waitUntil(addToCache(event.request));
});

let checkResponse = function(request){
    return new Promise(function(fulfill, reject) {
        fetch(request).then(function(response){
            if(response.status !== 404) {
                fulfill(response);
            } else {
                reject();
            }
        }, reject);
    });
};

let addToCache = function(request){
    return caches.open("offline").then(function (cache) {
        return fetch(request).then(function (response) {
            console.log(response.url + " was cached");
            return cache.put(request, response);
        });
    });
};

let returnFromCache = function(request){
    return caches.open("offline").then(function (cache) {
        return cache.match(request).then(function (matching) {
            if(!matching || matching.status === 404) {
                return cache.match("main.html");
            } else {
                return matching;
            }
        });
    });
};


 */