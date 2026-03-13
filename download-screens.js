const https = require('https');
const fs = require('fs');
const path = require('path');

const screens = [
    { name: 'editor.html', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ5Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpYCiVodG1sX2Q2ZjhmMjA1ZTQ1NjQzZDA5ZjAxMDEzY2I3OWMxODMzEgsSBxCum5TY4wUYAZIBIQoKcHJvamVjdF9pZBITQhE0MDk2ODU4NzExMTY3MTY1Nw&filename=&opi=96797242' },
    { name: 'login.html', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ5Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpYCiVodG1sXzU1OTY1YzczMWMwNzRjMDViNzI1ODEwMzkwZWI3MWYxEgsSBxCum5TY4wUYAZIBIQoKcHJvamVjdF9pZBITQhE0MDk2ODU4NzExMTY3MTY1Nw&filename=&opi=96797242' },
    { name: 'landing.html', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ5Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpYCiVodG1sX2JkMDNiYzU2OTU0ZTQ2NzdiZmRmYjNmYWE4ZGUzNmVmEgsSBxCum5TY4wUYAZIBIQoKcHJvamVjdF9pZBITQhE0MDk2ODU4NzExMTY3MTY1Nw&filename=&opi=96797242' },
    { name: 'jobs.html', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ5Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpYCiVodG1sXzFiNWYxOTRjNWIwMDQzNjA4MDJjYzU1ZjExNmRmYmE1EgsSBxCum5TY4wUYAZIBIQoKcHJvamVjdF9pZBITQhE0MDk2ODU4NzExMTY3MTY1Nw&filename=&opi=96797242' },
    { name: 'profile_new.html', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzM5YzBjYjEwMGI0NjQxMmE4YTQwOGQzMGU5ZDA3NWQ4EgsSBxCum5TY4wUYAZIBIwoKcHJvamVjdF9pZBIVQhM2NDkwOTM0MzI1NTIwNzYzNjI4&filename=&opi=96797242' },
    { name: 'settings_new.html', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzkwNWYyYjBiN2RkMDRkMDU4ZWU4ZGZiNzkwYjUwOTdkEgsSBxCum5TY4wUYAZIBIwoKcHJvamVjdF9pZBIVQhM2NDkwOTM0MzI1NTIwNzYzNjI4&filename=&opi=96797242' }
];

const destDir = path.join(__dirname, 'frontend', 'ts-mfe-shell', 'public', 'stitch');
if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

async function download() {
    for (const screen of screens) {
        const file = fs.createWriteStream(path.join(destDir, screen.name));
        await new Promise((resolve, reject) => {
            https.get(screen.url, function (response) {
                response.pipe(file);
                file.on('finish', function () {
                    file.close();  // close() is async, call cb after close completes.
                    console.log('Downloaded', screen.name);
                    resolve();
                });
            }).on('error', function (err) {
                fs.unlink(path.join(destDir, screen.name));
                reject(err);
            });
        });
    }
}

download().then(() => console.log('All done')).catch(console.error);
