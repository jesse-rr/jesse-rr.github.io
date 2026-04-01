const markdownFile = 'entries/';

fetch(markdownFile)
    .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.text();
    })
    .then(md => {
        document.getElementById('content').innerHTML = marked.parse(md);
    })
    .catch(err => {
        document.getElementById('content').innerHTML = `<p>Error loading page: ${err}</p>`;
    });