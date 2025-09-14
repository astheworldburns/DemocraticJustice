(()=>{var _=()=>{let r;try{r=localStorage.getItem("theme")}catch{r=null}let i=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches,h=r||(i?"dark":"light");document.documentElement.setAttribute("data-theme",h),window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",o=>{let E;try{E=localStorage.getItem("theme")}catch{E=null}E||document.documentElement.setAttribute("data-theme",o.matches?"dark":"light")})};var M=r=>{let i=document.createElement("template");return i.innerHTML=r.trim(),i.content.firstChild},F=r=>{let i=new Date(r);return isNaN(i.getTime())?"":i.toLocaleDateString(void 0,{year:"numeric",month:"long",day:"numeric"})},j=(r,i)=>{let h;return function(...E){let p=()=>{clearTimeout(h),r(...E)};clearTimeout(h),h=setTimeout(p,i)}};function O(){let r=[],i=[],h="grid",o={search:"",category:"All Categories",type:"All Types"},E=12,p=0,m,l=[],c=document.getElementById("case-grid"),g=document.getElementById("search-input"),f=document.getElementById("category-filter"),y=document.getElementById("type-filter"),A=document.getElementById("view-toggle"),B=document.getElementById("filter-badges"),I=document.getElementById("reset-filters"),D=document.getElementById("results-count"),b=document.createElement("button"),C=document.querySelector(".nav"),w=document.querySelector(".nav-toggle"),P=document.getElementById("primary-nav");b.className="btn btn-outline-blue",b.textContent="Load More",b.style.display="none",b.style.margin="32px auto",C&&w&&P&&(w.addEventListener("click",()=>{let e=w.getAttribute("aria-expanded")==="true";w.setAttribute("aria-expanded",String(!e)),C.classList.toggle("nav--open",!e),e?w.focus():P.querySelector("a")?.focus()}),document.addEventListener("keydown",e=>{e.key==="Escape"&&C.classList.contains("nav--open")&&(w.setAttribute("aria-expanded","false"),C.classList.remove("nav--open"),w.focus())}));let $=e=>e.category?.includes("Finance")||e.category?.includes("Campaign")?"Financial Violation":e.category?.includes("MOU")||e.category?.includes("DNC")?"Procedural Violation":e.category?.includes("Bylaw")||e.category?.includes("Charter")?"Governance Failure":"Other";function z(e){return e?.dataset?.proofId||e.querySelector("a")?.href?.split("/proofs/")[1]?.replace(/\/.*/,"")||""}function q(e){let t=document.getElementById("compare-btn");if(!t||!e)return;let n=e.querySelector(".compare-checkbox");n&&n.remove();let a=document.createElement("input");a.type="checkbox",a.className="compare-checkbox",a.title="Select for comparison (max 3)",a.addEventListener("change",s=>{let d=z(e);d&&(s.target.checked?l.length<3?l.push(d):(s.target.checked=!1,alert("Maximum 3 proofs can be compared.")):l=l.filter(L=>L!==d),t.textContent=`Compare Selected (${l.length})`,t.disabled=l.length<2)}),e.prepend(a)}function V(){let e=document.getElementById("compare-btn"),t=document.querySelectorAll(".case-card");!e||!t.length||(l=[],e.textContent="Compare Selected (0)",e.disabled=!0,t.forEach(n=>q(n)),e.onclick=()=>{l.length>=2&&K(l)})}function K(e){let t=document.getElementById("comparison-view");if(!t)return;let n=t.querySelector(".comparison-grid");if(!n)return;n.innerHTML=`
            <table class="comparison-table">
                <thead>
                    <tr>
                        <th>Aspect</th>
                        ${e.map(u=>`<th>Proof ${u.replace("wvdp-","").slice(0,10)}\u2026</th>`).join("")}
                    </tr>
                </thead>
                <tbody>
                    <tr><td>Category</td>${e.map(()=>"<td>Loading\u2026</td>").join("")}</tr>
                    <tr><td>Date</td>${e.map(()=>"<td>Loading\u2026</td>").join("")}</tr>
                    <tr><td>Key Violation</td>${e.map(()=>"<td>Loading\u2026</td>").join("")}</tr>
                </tbody>
            </table>
        `,t.style.display="block";let a=u=>r.find(v=>v.case_id===u||v.slug===u||v.slug&&u.startsWith(v.slug)),s=n.querySelectorAll("tbody tr"),d=s[0].querySelectorAll("td:not(:first-child)"),L=s[1].querySelectorAll("td:not(:first-child)"),k=s[2].querySelectorAll("td:not(:first-child)");e.forEach((u,v)=>{let x=a(u);x&&(d[v].textContent=x.category||"",L[v].textContent=new Date(x.date).toLocaleDateString(),k[v].textContent=x.violation||x.thesis||"")})}let U=()=>new IntersectionObserver((t,n)=>{t.forEach(a=>{if(!a.isIntersecting)return;let s=a.target;if(s.dataset.proofData){let d=JSON.parse(s.dataset.proofData);Y(s,d),s.dataset.proofData="",document.getElementById("compare-btn")&&q(s)}n.unobserve(s)})},{rootMargin:"50px"});class G{constructor(t){this.element=t,this.focusableElements=null,this.firstFocusable=null,this.lastFocusable=null,this.active=!1}activate(){this.active||(this.focusableElements=this.element.querySelectorAll('a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'),this.firstFocusable=this.focusableElements[0],this.lastFocusable=this.focusableElements[this.focusableElements.length-1],this.element.addEventListener("keydown",this.handleKeyDown.bind(this)),this.firstFocusable?.focus(),this.active=!0,this.lastFocus=document.activeElement)}deactivate(){this.active&&(this.element.removeEventListener("keydown",this.handleKeyDown.bind(this)),this.lastFocus?.focus(),this.active=!1)}handleKeyDown(t){if(t.key==="Tab"&&(t.shiftKey?document.activeElement===this.firstFocusable&&(t.preventDefault(),this.lastFocusable?.focus()):document.activeElement===this.lastFocusable&&(t.preventDefault(),this.firstFocusable?.focus())),t.key==="Escape"){this.deactivate();let n=this.element.closest(".modal");n&&(n.classList.remove("active"),n.setAttribute("hidden",""),document.body.classList.remove("body--modal-open"))}}}let W=()=>{if(!B)return;let e=[];o.search&&e.push(`
                <span class="filter-badge" data-filter="search">
                    Search: "${o.search}"
                    <button class="badge-remove" aria-label="Remove search filter">\xD7</button>
                </span>
            `),o.category!=="All Categories"&&e.push(`
                <span class="filter-badge" data-filter="category">
                    ${o.category}
                    <button class="badge-remove" aria-label="Remove category filter">\xD7</button>
                </span>
            `),o.type!=="All Types"&&e.push(`
                <span class="filter-badge" data-filter="type">
                    ${o.type}
                    <button class="badge-remove" aria-label="Remove type filter">\xD7</button>
                </span>
            `),B.innerHTML=e.join(""),B.querySelectorAll(".badge-remove").forEach(t=>{t.addEventListener("click",n=>{let a=n.target.parentElement.dataset.filter;a==="search"?(o.search="",g&&(g.value="")):a==="category"?(o.category="All Categories",f&&(f.value="All Categories")):a==="type"&&(o.type="All Types",y&&(y.value="All Types")),T()})})},J=(e,t=!1)=>{let n=`/proofs/${e.slug}/`,a=$(e);return t?`
                <article class="case-card case-card-lazy"
                         data-proof-id="${e.case_id||e.slug}"
                         data-proof-data='${JSON.stringify(e)}'>
                    <div class="card-skeleton">
                        <div class="skeleton-line skeleton-title"></div>
                        <div class="skeleton-line skeleton-meta"></div>
                        <div class="skeleton-line skeleton-text"></div>
                        <div class="skeleton-line skeleton-text"></div>
                    </div>
                </article>`:`
            <article class="case-card" data-type="${a}"
                     data-proof-id="${e.case_id||e.slug}">
                <div class="case-card-header">
                    <span class="proof-type-badge ${a.toLowerCase().replace(/\s+/g,"-")}">${a}</span>
                </div>
                <h3><a href="${n}">${e.title}</a></h3>
                <p class="case-meta">
                    ${e.case_id} \u2022 ${F(e.date)}
                    ${e.category?` \u2022 <span style="font-weight: 700;">${e.category}</span>`:""}
                </p>
                <p>${e.thesis}</p>
                <a href="${n}" class="case-link">Examine Proof \u2192</a>
            </article>`},Y=(e,t)=>{let n=`/proofs/${t.slug}/`,a=$(t);e.dataset.proofId=t.case_id||t.slug,e.innerHTML=`
            <div class="case-card-header">
                <span class="proof-type-badge ${a.toLowerCase().replace(/\s+/g,"-")}">${a}</span>
            </div>
            <h3><a href="${n}">${t.title}</a></h3>
            <p class="case-meta">
                ${t.case_id} \u2022 ${F(t.date)}
                ${t.category?` \u2022 <span style="font-weight: 700;">${t.category}</span>`:""}
            </p>
            <p>${t.thesis}</p>
            <a href="${n}" class="case-link">Examine Proof \u2192</a>`,e.classList.remove("case-card-lazy")},Q=e=>{if(!c)return;if(c.className="timeline-view",c.innerHTML="",!e||e.length===0){c.innerHTML='<p style="text-align:center;padding:40px;color:var(--muted);">No matching proofs found.</p>';return}let t={};e.forEach(a=>{let s=new Date(a.date),d=`${s.getFullYear()}-${String(s.getMonth()+1).padStart(2,"0")}`;t[d]||(t[d]=[]),t[d].push(a)}),Object.keys(t).sort().reverse().forEach(a=>{let[s,d]=a.split("-"),k=`
                <div class="timeline-month">
                    <h3 class="timeline-month-header">${new Date(s,d-1).toLocaleDateString("en",{month:"long",year:"numeric"})}</h3>
                    <div class="timeline-entries">
                        ${t[a].map(u=>`
                            <div class="timeline-entry">
                                <div class="timeline-date">${new Date(u.date).getDate()}</div>
                                <div class="timeline-content">
                                    <span class="timeline-category">${u.category}</span>
                                    <h4><a href="/proofs/${u.slug}/">${u.title}</a></h4>
                                    <p>${u.thesis}</p>
                                </div>
                            </div>
                        `).join("")}
                    </div>
                </div>
            `;c.appendChild(M(k))})},X=(e,t=!1)=>{if(!c)return;if(t||(c.className="case-grid",c.innerHTML="",p=0),!e||e.length===0){c.innerHTML='<p style="grid-column:1/-1;text-align:center;padding:40px;color:var(--muted);">No matching proofs found.</p>',b.style.display="none";return}let n=p,a=Math.min(n+E,e.length);e.slice(n,a).forEach((d,L)=>{let k=L>6,u=J(d,k),v=M(u);c.appendChild(v),k&&m&&m.observe(v)}),p=a,p<e.length?(b.style.display="block",c.parentElement.contains(b)||c.parentElement.appendChild(b)):b.style.display="none"},S=(e,t=!1)=>{h==="timeline"?Q(e):X(e,t),setTimeout(()=>V(),100)},N=()=>{if(!D)return;let e=r.length,t=i.length;D.textContent=t===e?`Showing all ${e} proofs`:`Showing ${t} of ${e} proofs`},T=()=>{o.search=g?g.value:"",o.category=f?f.value:"All Categories",o.type=y?y.value:"All Types",i=r.filter(e=>{if(o.category!=="All Categories"&&e.category!==o.category||o.type!=="All Types"&&$(e)!==o.type)return!1;if(o.search){let t=o.search.toLowerCase();if(![e.title,e.thesis,e.stakes,e.violation,e.case_id,e.category].join(" ").toLowerCase().includes(t))return!1}return!0}),S(i),N(),W()},Z=j(()=>{T()},300),ee=()=>{if(f){let e=["All Categories",...new Set(r.map(t=>t.category).filter(Boolean))];f.innerHTML="",e.forEach(t=>{let n=document.createElement("option");n.value=t,n.textContent=t,f.appendChild(n)})}if(y){let e=["All Types",...new Set(r.map(t=>$(t)))];y.innerHTML="",e.forEach(t=>{let n=document.createElement("option");n.value=t,n.textContent=t,y.appendChild(n)})}},te=()=>{let e=document.querySelectorAll(".modal");document.querySelectorAll("[data-modal-target]").forEach(n=>{n.addEventListener("click",()=>{let a=n.dataset.modalTarget,s=document.getElementById(a);s&&ne(s)})}),e.forEach(n=>{let a=n.querySelector(".modal-close"),s=new G(n);a?.addEventListener("click",()=>{H(n,s)}),n.addEventListener("click",d=>{d.target===n&&H(n,s)}),n._focusTrap=s})},ne=e=>{e.removeAttribute("hidden"),e.classList.add("active"),document.body.classList.add("body--modal-open"),e._focusTrap&&e._focusTrap.activate(),e.setAttribute("aria-modal","true"),e.setAttribute("role","dialog")},H=(e,t)=>{e.classList.remove("active"),e.setAttribute("hidden",""),document.body.classList.remove("body--modal-open"),t&&t.deactivate()};(async()=>{try{m=U();let e=await fetch("/data/proofs.json",{cache:"no-store"});if(!e.ok)throw new Error("Failed to load proofs.json");let t=await e.json();if(!Array.isArray(t))return;r=t.filter(n=>n&&n.title).sort((n,a)=>new Date(a.date)-new Date(n.date)||n.case_id.localeCompare(a.case_id)),i=[...r],ee(),S(i),N(),g&&g.addEventListener("input",Z),f&&f.addEventListener("change",T),y&&y.addEventListener("change",T),A&&A.addEventListener("click",()=>{h=h==="grid"?"timeline":"grid",A.textContent=h==="grid"?"Timeline View":"Grid View",S(i)}),b.addEventListener("click",()=>{S(i,!0)}),I&&I.addEventListener("click",()=>{o={search:"",category:"All Categories",type:"All Types"},g&&(g.value=""),f&&(f.value="All Categories"),y&&(y.value="All Types"),T()}),te()}catch(e){console.error("Error initializing archive:",e),c&&(c.innerHTML='<p style="grid-column:1/-1; text-align:center; padding:40px; color:red;">Could not load proofs. Please try again later.</p>')}})()}function R(){let r=(m=20)=>{let l=window.matchMedia("(prefers-reduced-motion: reduce)").matches;navigator.vibrate&&!l&&navigator.vibrate(m)},i=document.getElementById("share-btn-native");i?.addEventListener("click",async m=>{m.preventDefault();let l={title:i.dataset.shareTitle,text:i.dataset.shareText,url:i.dataset.shareUrl};if(r(),navigator.share)try{await navigator.share(l)}catch{}else{let c=encodeURIComponent(l.url),g=encodeURIComponent(l.title);window.open(`https://twitter.com/intent/tweet?url=${c}&text=${g}`,"_blank")}}),document.getElementById("print-btn")?.addEventListener("click",m=>{m.preventDefault(),r(),window.print()}),document.getElementById("request-review-btn")?.addEventListener("click",()=>r());let E=document.querySelectorAll("form#secure-contact"),p=document.getElementById("cta-error");E.forEach(m=>{m.addEventListener("submit",async l=>{l.preventDefault();let c=new URLSearchParams(new FormData(m)).toString();try{(await fetch("/",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:c})).ok?(r([20,50,20]),p?.style?.setProperty("display","none"),m.innerHTML="<p>Thanks\u2014we'll be in touch soon.</p>"):p?.style?.setProperty("display","block")}catch{p?.style?.setProperty("display","block")}})})}_();document.addEventListener("DOMContentLoaded",()=>{O(),R()});"serviceWorker"in navigator&&navigator.serviceWorker.register("/service-worker.js").catch(r=>{console.error("Service worker registration failed:",r)});})();
