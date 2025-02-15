console.log('IT’S ALIVE!');

// Utility function to select elements
function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// Automating the current page link highlight
document.addEventListener('DOMContentLoaded', () => {
  const navLinks = $$('nav a');
  const currentLink = navLinks.find(
    (a) => a.host === location.host && a.pathname === location.pathname
  );
  
  // Add 'current' class to the active link
  currentLink?.classList.add('current');
});

// Automatically creating the navigation menu
document.addEventListener('DOMContentLoaded', () => {
  const pages = [
    { url: "index.html", title: "Home" },
    { url: "projects/index.html", title: "Projects" },
    { url: "contact/index.html", title: "Contact" },
    { url: "resume/index.html", title: "Resume" },
    { url: "meta/index.html", title: "Meta" },
    { url: "https://github.com/matildagaddi", title: "GitHub" },
    // Add more pages as needed
  ];

  const nav = document.createElement('nav');
  document.body.prepend(nav);

  const ARE_WE_HOME = document.documentElement.classList.contains('home');
  
  for (let p of pages) {
    let url = p.url;
    let title = p.title;

    if (!ARE_WE_HOME && !url.startsWith('http')) {
      url = '../' + url;
    }

    let a = document.createElement('a');
    a.href = url;
    a.textContent = title;
    
    // Add 'current' class if this link is for the current page
    if (a.host === location.host && a.pathname === location.pathname) {
      a.classList.add('current');
    }

    // Add external links to open in a new tab
    if (a.host !== location.host) {
      a.target = "_blank";
    }
    console.log("Adding nav menu...");
    document.body.prepend(nav);
    nav.append(a);
  }
});

// Dark mode functionality
document.addEventListener('DOMContentLoaded', () => {
  // Add the dark mode switcher
  document.body.insertAdjacentHTML(
    'afterbegin',
    `
    <label class="color-scheme">
      Theme:
      <select>
        <option value="light dark">Automatic</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>`
  );

  const select = document.querySelector('select');
  
  // Load and set the user's preference if available
  if (localStorage.colorScheme) {
    document.documentElement.style.setProperty('color-scheme', localStorage.colorScheme);
    select.value = localStorage.colorScheme;
  }

  // Update color scheme based on selection
  select.addEventListener('input', function (event) {
    const value = event.target.value;
    document.documentElement.style.setProperty('color-scheme', value);
    localStorage.colorScheme = value;
  });
});



export async function fetchJSON(url) { //export causes errors and nav menu disappears
  try {
      // Fetch the JSON file from the given URL
      const response = await fetch(url);
      console.log(response)
      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.statusText}`);
        console.log(response)
      }
      const data = await response.json();
      return data; 

  } catch (error) {
      console.error('Error fetching or parsing JSON data:', error);
  }

}
// fetchJSON('../lib/projects.json');

const ARE_WE_HOME = document.documentElement.classList.contains('home');
export function renderProjects(projects, containerElement, headingLevel = 'h2') { //project is list
  
  containerElement.innerHTML = '';
  for (let project of projects) { 
  const article = document.createElement('article');
  let img_here = project.image
  if (!ARE_WE_HOME && !img_here.startsWith('http')) {
    img_here = '../' + img_here;
  }
  article.innerHTML = `
    <h3 class="project-title">${project.title}</h3>
    <img src="${img_here}" alt="${project.title}" style="width: 300px; height: auto;">
    <p>${project.description}</p>
    <p>${project.year}</p>
`; 
  containerElement.appendChild(article);
  }
}

export async function fetchGitHubData(username) {
  return fetchJSON(`https://api.github.com/users/${username}`);
}
