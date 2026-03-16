const API_KEY = "pub_4ccb88c3dd684fe5aef4cc8cd3b9b515";

const newsGrid = document.getElementById("newsGrid");
const loader = document.getElementById("loader");
const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");
const categories = document.querySelectorAll(".sidebar li");
const ticker = document.getElementById("tickerContent");

let page = 1;
let currentQuery = "world news";
let isFetching = false;
let isSearch = true; // Use search by default for better reliability on NewsData.io

function timeAgo(dateString) {
  try {
    const now = new Date();
    const past = new Date(dateString);
    const diff = Math.floor((now - past) / 1000);
    
    if (isNaN(diff)) return "Recently";
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  } catch (e) {
    return "Recently";
  }
}

async function fetchNews(query, append = false) {
  if (isFetching) return;
  isFetching = true;
  loader.style.display = "block";

  try {
    // NewsData.io structure: category is a separate parameter, q is for search
    let url = `https://newsdata.io/api/1/news?apikey=${API_KEY}&language=en`;
    
    if (isSearch) {
      url += `&q=${encodeURIComponent(query)}`;
    } else {
      url += `&category=${query}`;
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    
    const data = await res.json();

    if (data.results && data.results.length > 0) {
      if (!append) newsGrid.innerHTML = "";
      displayNews(data.results);
      if (!append) createTicker(data.results);
    } else if (!append) {
      newsGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--text-dim);">
          <i class="fas fa-newspaper" style="font-size: 3.5rem; margin-bottom: 20px; opacity: 0.3;"></i>
          <h2 style="color: var(--text-main); margin-bottom: 10px;">No Stories Found</h2>
          <p>We couldn't find any news for "${query}". Try searching for something else or check your connection.</p>
          <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: var(--primary); border: none; border-radius: 4px; font-weight: 700; cursor: pointer;">Retry Loading</button>
        </div>`;
    }
  } catch (error) {
    console.error("Error fetching news:", error);
    if (!append) {
      newsGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--text-dim);">
          <i class="fas fa-exclamation-triangle" style="font-size: 3.5rem; margin-bottom: 20px; color: #ff4d4d;"></i>
          <h2 style="color: var(--text-main); margin-bottom: 10px;">Unable to Load News</h2>
          <p>There was an error connecting to the news service. This might be due to API limits or network issues.</p>
          <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: var(--primary); border: none; border-radius: 4px; font-weight: 700; cursor: pointer;">Try Again</button>
        </div>`;
    }
  } finally {
    loader.style.display = "none";
    isFetching = false;
  }
}

function displayNews(articles) {
  articles.forEach(article => {
    const img = article.image_url || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80";
    const card = document.createElement("div");
    card.className = "news-card";
    
    card.innerHTML = `
      <div class="card-img" style="background-image:url('${img}')">
        <div class="source-badge">${article.source_id || "News"}</div>
      </div>
      <div class="card-content">
        <div class="card-meta">
          <span><i class="far fa-clock"></i> ${timeAgo(article.pubDate)}</span>
        </div>
        <h3>${article.title}</h3>
        <p>${article.description || "Click the button below to read the full coverage of this story from the original source."}</p>
        <a href="${article.link}" target="_blank" style="text-decoration: none; margin-top: auto;">
          <button class="read">Read Full Article <i class="fas fa-arrow-right"></i></button>
        </a>
      </div>
    `;

    // Modern 3D Tilt Effect
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / 25; 
      const rotateY = (centerX - x) / 25;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)`;
    });

    newsGrid.appendChild(card);
  });
}

function createTicker(articles) {
  let text = articles.map(a => `<i class="fas fa-fire" style="color: #ff4d00; margin-right: 8px;"></i> ${a.title}`).join("         ");
  ticker.innerHTML = text + "         " + text; 
}

searchBtn.onclick = () => {
  const q = searchInput.value.trim();
  if (!q) return;
  currentQuery = q;
  isSearch = true;
  page = 1;
  categories.forEach(i => i.classList.remove("active"));
  fetchNews(q);
};

searchInput.addEventListener("keypress", e => {
  if (e.key === "Enter") searchBtn.click();
});

categories.forEach(c => {
  c.onclick = () => {
    categories.forEach(i => i.classList.remove("active"));
    c.classList.add("active");
    const categoryName = c.textContent.trim().toLowerCase();
    
    if (categoryName === "general") {
      currentQuery = "top"; // NewsData.io uses 'top' or 'world' often
      isSearch = false;
    } else {
      currentQuery = categoryName;
      isSearch = false;
    }
    
    page = 1;
    fetchNews(currentQuery);
    
    // Close sidebar on mobile
    if (window.innerWidth <= 1024) {
      sidebar.classList.remove("show");
    }
  };
});

// Throttled Scroll
let scrollTimeout;
window.addEventListener("scroll", () => {
  if (scrollTimeout) return;
  scrollTimeout = setTimeout(() => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 800) {
      // Pagination for NewsData.io usually involves a nextPage token, but keeping simple for now
      // fetchNews(currentQuery, true); 
    }
    scrollTimeout = null;
  }, 250);
});

document.getElementById("voiceBtn").onclick = () => {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = 'en-US';
  recognition.start();
  recognition.onresult = e => {
    const speech = e.results[0][0].transcript;
    searchInput.value = speech;
    isSearch = true;
    fetchNews(speech);
  };
};

document.getElementById("themeToggle").onclick = () => {
  document.body.classList.toggle("light");
  const isLight = document.body.classList.contains("light");
  document.getElementById("themeToggle").textContent = isLight ? "☀️" : "🌙";
};

// Hamburger Toggle
const hamburger = document.getElementById("hamburger");
const sidebar = document.querySelector(".sidebar");

if (hamburger && sidebar) {
  hamburger.onclick = (e) => {
    e.stopPropagation();
    sidebar.classList.toggle("show");
  };

  document.addEventListener("click", (e) => {
    if (!sidebar.contains(e.target) && !hamburger.contains(e.target)) {
      sidebar.classList.remove("show");
    }
  });
}

// Initial Load
fetchNews(currentQuery);