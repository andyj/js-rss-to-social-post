document.addEventListener('DOMContentLoaded', function() {
  // Array of RSS URLs
  // const rssUrls = [
  // 'https://feeds.skynews.com/feeds/rss/politics.xml',
  // 'https://www.politics.co.uk/feed/',
  // 'http://www.huffingtonpost.co.uk/feeds/verticals/uk-politics/index.xml'
  // ];
  
  // Get the element where the content will be displayed
  const contentElement = document.getElementById('content');
  
  window.addRssUrl = () => {
    const rssUrl = document.getElementById('rssUrl').value;
    let rssUrls = JSON.parse(localStorage.getItem('rssUrls')) || [];
    if (!rssUrls.includes(rssUrl)) {
      rssUrls.push(rssUrl);
      localStorage.setItem('rssUrls', JSON.stringify(rssUrls));
      loadFeeds();
    }
  };

  window.deleteRssUrl = () => {
    const rssUrl = document.getElementById('rssUrl').value;
    let rssUrls = JSON.parse(localStorage.getItem('rssUrls')) || [];
    const index = rssUrls.indexOf(rssUrl);
    if (index > -1) {
      rssUrls.splice(index, 1);
      localStorage.setItem('rssUrls', JSON.stringify(rssUrls));
      loadFeeds();
    }
  };

  window.loadFeeds = () => {
    contentElement.innerHTML = '';
    const rssUrls = JSON.parse(localStorage.getItem('rssUrls')) || [];
    const allArticles = [];
  
    let requests = rssUrls.map(rssUrl => fetchFeed(rssUrl, allArticles));
      
    Promise.all(requests).then(() => {
      allArticles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
      allArticles.forEach(article => displayArticle(article));
    });
  };
  
  function fetchFeed(rssUrl, allArticles) {

    // Check if the feed was fetched in the last 15 minutes
    const lastFetchTime = localStorage.getItem(`${rssUrl}-time`);
    const storedData = localStorage.getItem(`${rssUrl}-data`);
    const currentTime = new Date().getTime();
    
    if (lastFetchTime && storedData && (currentTime - lastFetchTime) < 15 * 60 * 1000) {
      console.log(`Feed from ${rssUrl} was fetched less than 15 minutes ago.`);
      const storedArticles = JSON.parse(storedData).items;
      allArticles.push(...storedArticles.map(item => ({ ...item, rssUrl })));
      return;
    }
    
    // Convert the RSS feed to JSON format using an online service
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
    
    // Fetch the RSS feed in JSON format
    fetch(apiUrl).then(response => {
      if (response.ok) {
        return response.json();
      } else {
        throw new Error('Failed to fetch RSS feed.');
      }
    }).then(data => {
      // Update the last fetch time in local storage
      localStorage.setItem(`${rssUrl}-time`, currentTime.toString());
      localStorage.setItem(`${rssUrl}-data`, JSON.stringify(data));
      
      // Push each article to the allArticles array
      allArticles.push(...data.items.map(item => ({ ...item, rssUrl })));
      
    }).catch(error => {
      console.error('Error:', error);
    });
  }
  


 
  
  function displayArticle(article) {
    // Create the formatted string for each article
    const formattedString = `[${article.title}](${article.link})<br><sub>${article.rssUrl}</sub>`;
    
    // Create a container div for each item
    const itemContainer = document.createElement('div');

    // Create a paragraph element for each formatted string
    const p = document.createElement('pre');
    p.innerHTML = formattedString;
    p.classList.add("my-3")

    // Create a button element for each item
    const button = document.createElement('button');
    button.textContent = 'Copy to Clipboard';
    button.classList.add('btn');
    button.classList.add('btn-primary');
    button.classList.add('btn-sm');

    // Add a click event listener to the button to copy the formatted string to the clipboard
    button.addEventListener('click', () => {
      navigator.clipboard.writeText(`[${article.title}](${article.link})`).then(() => {
        console.log('Text successfully copied to clipboard');
      }).catch(err => {
        console.error('Error trying to copy text to clipboard', err);
      });
    });

    // Append the paragraph and button elements to the container div
    itemContainer.appendChild(p);
    itemContainer.appendChild(button);

    // Append the container div to the content element
    contentElement.appendChild(itemContainer);
  }
  
});