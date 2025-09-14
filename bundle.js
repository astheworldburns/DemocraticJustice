(()=>{var N=()=>{let o=localStorage.getItem("theme"),i=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches,h=o||(i?"dark":"light");document.documentElement.setAttribute("data-theme",h),window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",r=>{localStorage.getItem("theme")||document.documentElement.setAttribute("data-theme",r.matches?"dark":"light")})};var S=o=>{let i=document.createElement("template");return i.innerHTML=o.trim(),i.content.firstChild},B=o=>{let i=new Date(o);return isNaN(i.getTime())?"":i.toLocaleDateString(void 0,{year:"numeric",month:"long",day:"numeric"})},q=(o,i)=>{let h;return function(...L){let v=()=>{clearTimeout(h),o(...L)};clearTimeout(h),h=setTimeout(v,i)}};function H(){let o=[],i=[],h="grid",r={search:"",category:"All Categories",type:"All Types"},L=12,v=0,m,l=[],c=document.getElementById("case-grid"),p=document.getElementById("search-input"),f=document.getElementById("category-filter"),g=document.getElementById("type-filter"),x=document.getElementById("view-toggle"),A=document.getElementById("filter-badges"),M=document.getElementById("reset-filters"),F=document.getElementById("results-count"),b=document.createElement("button");b.className="btn btn-outline-blue",b.textContent="Load More",b.style.display="none",b.style.margin="32px auto";let C=e=>e.category?.includes("Finance")||e.category?.includes("Campaign")?"Financial Violation":e.category?.includes("MOU")||e.category?.includes("DNC")?"Procedural Violation":e.category?.includes("Bylaw")||e.category?.includes("Charter")?"Governance Failure":"Other";function j(e){return e?.dataset?.proofId||e.querySelector("a")?.href?.split("/proofs/")[1]?.replace(/\/.*/,"")||""}function I(e){let t=document.getElementById("compare-btn");if(!t||!e)return;let n=e.querySelector(".compare-checkbox");n&&n.remove();let a=document.createElement("input");a.type="checkbox",a.className="compare-checkbox",a.title="Select for comparison (max 3)",a.addEventListener("change",s=>{let d=j(e);d&&(s.target.checked?l.length<3?l.push(d):(s.target.checked=!1,alert("Maximum 3 proofs can be compared.")):l=l.filter(E=>E!==d),t.textContent=`Compare Selected (${l.length})`,t.disabled=l.length<2)}),e.prepend(a)}function O(){let e=document.getElementById("compare-btn"),t=document.querySelectorAll(".case-card");!e||!t.length||(l=[],e.textContent="Compare Selected (0)",e.disabled=!0,t.forEach(n=>I(n)),e.onclick=()=>{l.length>=2&&R(l)})}function R(e){let t=document.getElementById("comparison-view");if(!t)return;let n=t.querySelector(".comparison-grid");if(!n)return;n.innerHTML=`
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
        `,t.style.display="block";let a=u=>o.find(y=>y.case_id===u||y.slug===u||y.slug&&u.startsWith(y.slug)),s=n.querySelectorAll("tbody tr"),d=s[0].querySelectorAll("td:not(:first-child)"),E=s[1].querySelectorAll("td:not(:first-child)"),w=s[2].querySelectorAll("td:not(:first-child)");e.forEach((u,y)=>{let k=a(u);k&&(d[y].textContent=k.category||"",E[y].textContent=new Date(k.date).toLocaleDateString(),w[y].textContent=k.violation||k.thesis||"")})}let z=()=>new IntersectionObserver((t,n)=>{t.forEach(a=>{if(!a.isIntersecting)return;let s=a.target;if(s.dataset.proofData){let d=JSON.parse(s.dataset.proofData);G(s,d),s.dataset.proofData="",document.getElementById("compare-btn")&&I(s)}n.unobserve(s)})},{rootMargin:"50px"});class V{constructor(t){this.element=t,this.focusableElements=null,this.firstFocusable=null,this.lastFocusable=null,this.active=!1}activate(){this.active||(this.focusableElements=this.element.querySelectorAll('a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'),this.firstFocusable=this.focusableElements[0],this.lastFocusable=this.focusableElements[this.focusableElements.length-1],this.element.addEventListener("keydown",this.handleKeyDown.bind(this)),this.firstFocusable?.focus(),this.active=!0,this.lastFocus=document.activeElement)}deactivate(){this.active&&(this.element.removeEventListener("keydown",this.handleKeyDown.bind(this)),this.lastFocus?.focus(),this.active=!1)}handleKeyDown(t){if(t.key==="Tab"&&(t.shiftKey?document.activeElement===this.firstFocusable&&(t.preventDefault(),this.lastFocusable?.focus()):document.activeElement===this.lastFocusable&&(t.preventDefault(),this.firstFocusable?.focus())),t.key==="Escape"){this.deactivate();let n=this.element.closest(".modal");n&&(n.classList.remove("active"),n.setAttribute("hidden",""),document.body.classList.remove("body--modal-open"))}}}let K=()=>{if(!A)return;let e=[];r.search&&e.push(`
                <span class="filter-badge" data-filter="search">
                    Search: "${r.search}"
                    <button class="badge-remove" aria-label="Remove search filter">\xD7</button>
                </span>
            `),r.category!=="All Categories"&&e.push(`
                <span class="filter-badge" data-filter="category">
                    ${r.category}
                    <button class="badge-remove" aria-label="Remove category filter">\xD7</button>
                </span>
            `),r.type!=="All Types"&&e.push(`
                <span class="filter-badge" data-filter="type">
                    ${r.type}
                    <button class="badge-remove" aria-label="Remove type filter">\xD7</button>
                </span>
            `),A.innerHTML=e.join(""),A.querySelectorAll(".badge-remove").forEach(t=>{t.addEventListener("click",n=>{let a=n.target.parentElement.dataset.filter;a==="search"?(r.search="",p&&(p.value="")):a==="category"?(r.category="All Categories",f&&(f.value="All Categories")):a==="type"&&(r.type="All Types",g&&(g.value="All Types")),T()})})},U=(e,t=!1)=>{let n=`/proofs/${e.slug}/`,a=C(e);return t?`
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
                    ${e.case_id} \u2022 ${B(e.date)}
                    ${e.category?` \u2022 <span style="font-weight: 700;">${e.category}</span>`:""}
                </p>
                <p>${e.thesis}</p>
                <a href="${n}" class="case-link">Examine Proof \u2192</a>
            </article>`},G=(e,t)=>{let n=`/proofs/${t.slug}/`,a=C(t);e.dataset.proofId=t.case_id||t.slug,e.innerHTML=`
            <div class="case-card-header">
                <span class="proof-type-badge ${a.toLowerCase().replace(/\s+/g,"-")}">${a}</span>
            </div>
            <h3><a href="${n}">${t.title}</a></h3>
            <p class="case-meta">
                ${t.case_id} \u2022 ${B(t.date)}
                ${t.category?` \u2022 <span style="font-weight: 700;">${t.category}</span>`:""}
            </p>
            <p>${t.thesis}</p>
            <a href="${n}" class="case-link">Examine Proof \u2192</a>`,e.classList.remove("case-card-lazy")},W=e=>{if(!c)return;if(c.className="timeline-view",c.innerHTML="",!e||e.length===0){c.innerHTML='<p style="text-align:center;padding:40px;color:var(--muted);">No matching proofs found.</p>';return}let t={};e.forEach(a=>{let s=new Date(a.date),d=`${s.getFullYear()}-${String(s.getMonth()+1).padStart(2,"0")}`;t[d]||(t[d]=[]),t[d].push(a)}),Object.keys(t).sort().reverse().forEach(a=>{let[s,d]=a.split("-"),w=`
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
            `;c.appendChild(S(w))})},J=(e,t=!1)=>{if(!c)return;if(t||(c.className="case-grid",c.innerHTML="",v=0),!e||e.length===0){c.innerHTML='<p style="grid-column:1/-1;text-align:center;padding:40px;color:var(--muted);">No matching proofs found.</p>',b.style.display="none";return}let n=v,a=Math.min(n+L,e.length);e.slice(n,a).forEach((d,E)=>{let w=E>6,u=U(d,w),y=S(u);c.appendChild(y),w&&m&&m.observe(y)}),v=a,v<e.length?(b.style.display="block",c.parentElement.contains(b)||c.parentElement.appendChild(b)):b.style.display="none"},$=(e,t=!1)=>{h==="timeline"?W(e):J(e,t),setTimeout(()=>O(),100)},D=()=>{if(!F)return;let e=o.length,t=i.length;F.textContent=t===e?`Showing all ${e} proofs`:`Showing ${t} of ${e} proofs`},T=()=>{r.search=p?p.value:"",r.category=f?f.value:"All Categories",r.type=g?g.value:"All Types",i=o.filter(e=>{if(r.category!=="All Categories"&&e.category!==r.category||r.type!=="All Types"&&C(e)!==r.type)return!1;if(r.search){let t=r.search.toLowerCase();if(![e.title,e.thesis,e.stakes,e.violation,e.case_id,e.category].join(" ").toLowerCase().includes(t))return!1}return!0}),$(i),D(),K()},Y=q(()=>{T()},300),Q=()=>{if(f){let e=["All Categories",...new Set(o.map(t=>t.category).filter(Boolean))];f.innerHTML="",e.forEach(t=>{let n=document.createElement("option");n.value=t,n.textContent=t,f.appendChild(n)})}if(g){let e=["All Types",...new Set(o.map(t=>C(t)))];g.innerHTML="",e.forEach(t=>{let n=document.createElement("option");n.value=t,n.textContent=t,g.appendChild(n)})}},X=()=>{let e=document.querySelectorAll(".modal");document.querySelectorAll("[data-modal-target]").forEach(n=>{n.addEventListener("click",()=>{let a=n.dataset.modalTarget,s=document.getElementById(a);s&&Z(s)})}),e.forEach(n=>{let a=n.querySelector(".modal-close"),s=new V(n);a?.addEventListener("click",()=>{P(n,s)}),n.addEventListener("click",d=>{d.target===n&&P(n,s)}),n._focusTrap=s})},Z=e=>{e.removeAttribute("hidden"),e.classList.add("active"),document.body.classList.add("body--modal-open"),e._focusTrap&&e._focusTrap.activate(),e.setAttribute("aria-modal","true"),e.setAttribute("role","dialog")},P=(e,t)=>{e.classList.remove("active"),e.setAttribute("hidden",""),document.body.classList.remove("body--modal-open"),t&&t.deactivate()};(async()=>{try{m=z();let e=await fetch("/data/proofs.json",{cache:"no-store"});if(!e.ok)throw new Error("Failed to load proofs.json");let t=await e.json();if(!Array.isArray(t))return;o=t.filter(n=>n&&n.title).sort((n,a)=>new Date(a.date)-new Date(n.date)||n.case_id.localeCompare(a.case_id)),i=[...o],Q(),$(i),D(),p&&p.addEventListener("input",Y),f&&f.addEventListener("change",T),g&&g.addEventListener("change",T),x&&x.addEventListener("click",()=>{h=h==="grid"?"timeline":"grid",x.textContent=h==="grid"?"Timeline View":"Grid View",$(i)}),b.addEventListener("click",()=>{$(i,!0)}),M&&M.addEventListener("click",()=>{r={search:"",category:"All Categories",type:"All Types"},p&&(p.value=""),f&&(f.value="All Categories"),g&&(g.value="All Types"),T()}),X()}catch(e){console.error("Error initializing archive:",e),c&&(c.innerHTML='<p style="grid-column:1/-1; text-align:center; padding:40px; color:red;">Could not load proofs. Please try again later.</p>')}})()}function _(){let o=(m=20)=>{let l=window.matchMedia("(prefers-reduced-motion: reduce)").matches;navigator.vibrate&&!l&&navigator.vibrate(m)},i=document.getElementById("share-btn-native");i?.addEventListener("click",async m=>{m.preventDefault();let l={title:i.dataset.shareTitle,text:i.dataset.shareText,url:i.dataset.shareUrl};if(o(),navigator.share)try{await navigator.share(l)}catch{}else{let c=encodeURIComponent(l.url),p=encodeURIComponent(l.title);window.open(`https://twitter.com/intent/tweet?url=${c}&text=${p}`,"_blank")}}),document.getElementById("print-btn")?.addEventListener("click",m=>{m.preventDefault(),o(),window.print()}),document.getElementById("request-review-btn")?.addEventListener("click",()=>o());let L=document.querySelectorAll("form#secure-contact"),v=document.getElementById("cta-error");L.forEach(m=>{m.addEventListener("submit",async l=>{l.preventDefault();let c=new URLSearchParams(new FormData(m)).toString();try{(await fetch("/",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:c})).ok?(o([20,50,20]),v?.style?.setProperty("display","none"),m.innerHTML="<p>Thanks\u2014we'll be in touch soon.</p>"):v?.style?.setProperty("display","block")}catch{v?.style?.setProperty("display","block")}})})}N();document.addEventListener("DOMContentLoaded",()=>{H(),_()});"serviceWorker"in navigator&&navigator.serviceWorker.register("/service-worker.js").catch(o=>{console.error("Service worker registration failed:",o)});})();
