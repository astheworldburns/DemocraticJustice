(()=>{var S=o=>{let r=document.createElement("template");return r.innerHTML=o.trim(),r.content.firstChild},F=o=>{let r=new Date(o);return isNaN(r.getTime())?"":r.toLocaleDateString(void 0,{year:"numeric",month:"long",day:"numeric"})},P=(o,r)=>{let u;return function(...L){let v=()=>{clearTimeout(u),o(...L)};clearTimeout(u),u=setTimeout(v,r)}};function q(){let o=[],r=[],u="grid",i={search:"",category:"All Categories",type:"All Types"},L=12,v=0,x,p=[],d=document.getElementById("case-grid"),y=document.getElementById("search-input"),m=document.getElementById("category-filter"),h=document.getElementById("type-filter"),k=document.getElementById("view-toggle"),A=document.getElementById("filter-badges"),M=document.getElementById("reset-filters"),B=document.getElementById("results-count"),g=document.createElement("button");g.className="btn btn-outline-blue",g.textContent="Load More",g.style.display="none",g.style.margin="32px auto";let C=e=>e.category?.includes("Finance")||e.category?.includes("Campaign")?"Financial Violation":e.category?.includes("MOU")||e.category?.includes("DNC")?"Procedural Violation":e.category?.includes("Bylaw")||e.category?.includes("Charter")?"Governance Failure":"Other";function H(e){return e?.dataset?.proofId||e.querySelector("a")?.href?.split("/proofs/")[1]?.replace(/\/.*/,"")||""}function I(e){let t=document.getElementById("compare-btn");if(!t||!e)return;let n=e.querySelector(".compare-checkbox");n&&n.remove();let a=document.createElement("input");a.type="checkbox",a.className="compare-checkbox",a.title="Select for comparison (max 3)",a.addEventListener("change",s=>{let l=H(e);l&&(s.target.checked?p.length<3?p.push(l):(s.target.checked=!1,alert("Maximum 3 proofs can be compared.")):p=p.filter(b=>b!==l),t.textContent=`Compare Selected (${p.length})`,t.disabled=p.length<2)}),e.prepend(a)}function j(){let e=document.getElementById("compare-btn"),t=document.querySelectorAll(".case-card");!e||!t.length||(p=[],e.textContent="Compare Selected (0)",e.disabled=!0,t.forEach(n=>I(n)),e.onclick=()=>{p.length>=2&&O(p)})}function O(e){let t=document.getElementById("comparison-view");if(!t)return;let n=t.querySelector(".comparison-grid");if(!n)return;n.innerHTML=`
            <table class="comparison-table">
                <thead>
                    <tr>
                        <th>Aspect</th>
                        ${e.map(c=>`<th>Proof ${c.replace("wvdp-","").slice(0,10)}…</th>`).join("")}
                    </tr>
                </thead>
                <tbody>
                    <tr><td>Category</td>${e.map(()=>"<td>Loading…</td>").join("")}</tr>
                    <tr><td>Date</td>${e.map(()=>"<td>Loading…</td>").join("")}</tr>
                    <tr><td>Key Violation</td>${e.map(()=>"<td>Loading…</td>").join("")}</tr>
                </tbody>
            </table>
        `,t.style.display="block";let a=c=>o.find(f=>f.case_id===c||f.slug===c||f.slug&&c.startsWith(f.slug)),s=n.querySelectorAll("tbody tr"),l=s[0].querySelectorAll("td:not(:first-child)"),b=s[1].querySelectorAll("td:not(:first-child)"),E=s[2].querySelectorAll("td:not(:first-child)");e.forEach((c,f)=>{let $=a(c);$&&(l[f].textContent=$.category||"",b[f].textContent=new Date($.date).toLocaleDateString(),E[f].textContent=$.violation||$.thesis||"")})}let R=()=>new IntersectionObserver((t,n)=>{t.forEach(a=>{if(!a.isIntersecting)return;let s=a.target;if(s.dataset.proofData){let l=JSON.parse(s.dataset.proofData);U(s,l),s.dataset.proofData="",document.getElementById("compare-btn")&&I(s)}n.unobserve(s)})},{rootMargin:"50px"});class z{constructor(t){this.element=t,this.focusableElements=null,this.firstFocusable=null,this.lastFocusable=null,this.active=!1}activate(){this.active||(this.focusableElements=this.element.querySelectorAll('a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'),this.firstFocusable=this.focusableElements[0],this.lastFocusable=this.focusableElements[this.focusableElements.length-1],this.element.addEventListener("keydown",this.handleKeyDown.bind(this)),this.firstFocusable?.focus(),this.active=!0,this.lastFocus=document.activeElement)}deactivate(){this.active&&(this.element.removeEventListener("keydown",this.handleKeyDown.bind(this)),this.lastFocus?.focus(),this.active=!1)}handleKeyDown(t){if(t.key==="Tab"&&(t.shiftKey?document.activeElement===this.firstFocusable&&(t.preventDefault(),this.lastFocusable?.focus()):document.activeElement===this.lastFocusable&&(t.preventDefault(),this.firstFocusable?.focus())),t.key==="Escape"){this.deactivate();let n=this.element.closest(".modal");n&&(n.classList.remove("active"),n.setAttribute("hidden",""),document.body.classList.remove("body--modal-open"))}}}let V=()=>{if(!A)return;let e=[];i.search&&e.push(`
                <span class="filter-badge" data-filter="search">
                    Search: "${i.search}"
                    <button class="badge-remove" aria-label="Remove search filter">×</button>
                </span>
            `),i.category!=="All Categories"&&e.push(`
                <span class="filter-badge" data-filter="category">
                    ${i.category}
                    <button class="badge-remove" aria-label="Remove category filter">×</button>
                </span>
            `),i.type!=="All Types"&&e.push(`
                <span class="filter-badge" data-filter="type">
                    ${i.type}
                    <button class="badge-remove" aria-label="Remove type filter">×</button>
                </span>
            `),A.innerHTML=e.join(""),A.querySelectorAll(".badge-remove").forEach(t=>{t.addEventListener("click",n=>{let a=n.target.parentElement.dataset.filter;a==="search"?(i.search="",y&&(y.value="")):a==="category"?(i.category="All Categories",m&&(m.value="All Categories")):a==="type"&&(i.type="All Types",h&&(h.value="All Types")),T()})})},K=(e,t=!1)=>{let n=`/proofs/${e.slug}/`,a=C(e);return t?`
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
                    ${e.case_id} • ${F(e.date)}
                    ${e.category?` • <span style="font-weight: 700;">${e.category}</span>`:""}
                </p>
                <p>${e.thesis}</p>
                <a href="${n}" class="case-link">Examine Proof →</a>
            </article>`},U=(e,t)=>{let n=`/proofs/${t.slug}/`,a=C(t);e.dataset.proofId=t.case_id||t.slug,e.innerHTML=`
            <div class="case-card-header">
                <span class="proof-type-badge ${a.toLowerCase().replace(/\s+/g,"-")}">${a}</span>
            </div>
            <h3><a href="${n}">${t.title}</a></h3>
            <p class="case-meta">
                ${t.case_id} • ${F(t.date)}
                ${t.category?` • <span style="font-weight: 700;">${t.category}</span>`:""}
            </p>
            <p>${t.thesis}</p>
            <a href="${n}" class="case-link">Examine Proof →</a>`,e.classList.remove("case-card-lazy")},G=e=>{if(!d)return;if(d.className="timeline-view",d.innerHTML="",!e||e.length===0){d.innerHTML='<p style="text-align:center;padding:40px;color:var(--muted);">No matching proofs found.</p>';return}let t={};e.forEach(a=>{let s=new Date(a.date),l=`${s.getFullYear()}-${String(s.getMonth()+1).padStart(2,"0")}`;t[l]||(t[l]=[]),t[l].push(a)}),Object.keys(t).sort().reverse().forEach(a=>{let[s,l]=a.split("-"),E=`
                <div class="timeline-month">
                    <h3 class="timeline-month-header">${new Date(s,l-1).toLocaleDateString("en",{month:"long",year:"numeric"})}</h3>
                    <div class="timeline-entries">
                        ${t[a].map(c=>`
                            <div class="timeline-entry">
                                <div class="timeline-date">${new Date(c.date).getDate()}</div>
                                <div class="timeline-content">
                                    <span class="timeline-category">${c.category}</span>
                                    <h4><a href="/proofs/${c.slug}/">${c.title}</a></h4>
                                    <p>${c.thesis}</p>
                                </div>
                            </div>
                        `).join("")}
                    </div>
                </div>
            `;d.appendChild(S(E))})},J=(e,t=!1)=>{if(!d)return;if(t||(d.className="case-grid",d.innerHTML="",v=0),!e||e.length===0){d.innerHTML='<p style="grid-column:1/-1;text-align:center;padding:40px;color:var(--muted);">No matching proofs found.</p>',g.style.display="none";return}let n=v,a=Math.min(n+L,e.length);e.slice(n,a).forEach((l,b)=>{let E=b>6,c=K(l,E),f=S(c);d.appendChild(f),E&&x&&x.observe(f)}),v=a,v<e.length?(g.style.display="block",d.parentElement.contains(g)||d.parentElement.appendChild(g)):g.style.display="none"},w=(e,t=!1)=>{u==="timeline"?G(e):J(e,t),setTimeout(()=>j(),100)},D=()=>{if(!B)return;let e=o.length,t=r.length;B.textContent=t===e?`Showing all ${e} proofs`:`Showing ${t} of ${e} proofs`},T=()=>{i.search=y?y.value:"",i.category=m?m.value:"All Categories",i.type=h?h.value:"All Types",r=o.filter(e=>{if(i.category!=="All Categories"&&e.category!==i.category||i.type!=="All Types"&&C(e)!==i.type)return!1;if(i.search){let t=i.search.toLowerCase();if(![e.title,e.thesis,e.stakes,e.violation,e.case_id,e.category].join(" ").toLowerCase().includes(t))return!1}return!0}),w(r),D(),V()},W=P(()=>{T()},300),Y=()=>{if(m){let e=["All Categories",...new Set(o.map(t=>t.category).filter(Boolean))];m.innerHTML="",e.forEach(t=>{let n=document.createElement("option");n.value=t,n.textContent=t,m.appendChild(n)})}if(h){let e=["All Types",...new Set(o.map(t=>C(t)))];h.innerHTML="",e.forEach(t=>{let n=document.createElement("option");n.value=t,n.textContent=t,h.appendChild(n)})}},Q=()=>{let e=document.querySelectorAll(".modal");document.querySelectorAll("[data-modal-target]").forEach(n=>{n.addEventListener("click",()=>{let a=n.dataset.modalTarget,s=document.getElementById(a);s&&X(s)})}),e.forEach(n=>{let a=n.querySelector(".modal-close"),s=new z(n);a?.addEventListener("click",()=>{N(n,s)}),n.addEventListener("click",l=>{l.target===n&&N(n,s)}),n._focusTrap=s})},X=e=>{e.removeAttribute("hidden"),e.classList.add("active"),document.body.classList.add("body--modal-open"),e._focusTrap&&e._focusTrap.activate(),e.setAttribute("aria-modal","true"),e.setAttribute("role","dialog")},N=(e,t)=>{e.classList.remove("active"),e.setAttribute("hidden",""),document.body.classList.remove("body--modal-open"),t&&t.deactivate()};(async()=>{try{x=R();let e=await fetch("/data/proofs.json",{cache:"no-store"});if(!e.ok)throw new Error("Failed to load proofs.json");let t=await e.json();if(!Array.isArray(t))return;o=t.filter(n=>n&&n.title).sort((n,a)=>new Date(a.date)-new Date(n.date)||n.case_id.localeCompare(a.case_id)),r=[...o],Y(),w(r),D(),y&&y.addEventListener("input",W),m&&m.addEventListener("change",T),h&&h.addEventListener("change",T),k&&k.addEventListener("click",()=>{u=u==="grid"?"timeline":"grid",k.textContent=u==="grid"?"Timeline View":"Grid View",w(r)}),g.addEventListener("click",()=>{w(r,!0)}),M&&M.addEventListener("click",()=>{i={search:"",category:"All Categories",type:"All Types"},y&&(y.value=""),m&&(m.value="All Categories"),h&&(h.value="All Types"),T()}),Q()}catch(e){console.error("Error initializing archive:",e),d&&(d.innerHTML='<p style="grid-column:1/-1; text-align:center; padding:40px; color:red;">Could not load proofs. Please try again later.</p>')}})()}function _(){let o=document.getElementById("share-btn-native");o&&o.addEventListener("click",async r=>{r.preventDefault();let u={title:o.dataset.shareTitle,text:o.dataset.shareText,url:o.dataset.shareUrl};if(navigator.share)try{await navigator.share(u)}catch{}else{let i=encodeURIComponent(u.url),L=encodeURIComponent(u.title);window.open(`https://twitter.com/intent/tweet?url=${i}&text=${L}`,"_blank")}})}document.addEventListener("DOMContentLoaded",()=>{q(),_()});})();
