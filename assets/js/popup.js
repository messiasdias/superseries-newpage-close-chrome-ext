var isStarted = false;

const setBntText = (btn, started = false) => {
    if (started) {
        btn.style.opacity = 1;
        btn.innerHTML = "Parar"; // "⏹ Parar"}
    } else {
        btn.style.opacity = .6;
        btn.innerHTML = "Iniciar"; //"▶️ Iniciar" 
    }
};

const setIsStarted = (btn, started = false) => {
    if (started) {
        localStorage.setItem('isStarted', started);
    } else {
        localStorage.removeItem('isStarted');
    }

    isStarted = started;
    setBntText(btn, isStarted);

    chrome.runtime.sendMessage(chrome.runtime.id, { isStarted });
};

const extractDomainFromUrl = (url) => {
    var result = ""
    var match
    if (match = url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n\?\=]+)/im)) {
        result = match[1]
        if (match = result.match(/^[^\.]+\.(.+\..+)$/)) {
            result = match[0] || match[1]
        }
    }
    console.log('extractDomainFromUrl result', result)
    return result
}

document.addEventListener("DOMContentLoaded", () => {
    isStarted = !!localStorage.getItem('isStarted');

    const loopBtn = document.querySelector("#loopBtn");
    setIsStarted(loopBtn, isStarted);
    loopBtn.addEventListener("click", () => {
        setIsStarted(loopBtn, !isStarted)
    });

    const main = document.querySelector('#main');
    const formAddDomain = document.querySelector('#form-add-domain ');
    const formListDomain = document.querySelector('#form-list-domain ');

    //On start
    main.style.display = 'flex';
    formAddDomain.style.display = 'none';
    formListDomain.style.display = 'none';

    const spanAdd = document.querySelector('span.add');
    spanAdd.addEventListener("click", () => {
        main.style.display = 'none';
        formAddDomain.style.display = 'flex';
        formListDomain.style.display = 'none';

        const addDomainBtn = formAddDomain.querySelector('#form-add-domain>button');
        const addDomainInput = formAddDomain.querySelector('#form-add-domain>input');

        addDomainBtn.addEventListener("click", () => {
            chrome.runtime.sendMessage(chrome.runtime.id, { addDomain: extractDomainFromUrl(addDomainInput.value) });
            addDomainInput.value = null;
            spanCloses[0].click()
        });

        addDomainInput.addEventListener("change", (e) => {
            if (
                !!e.target.value &&
                e.target.value.length >= 2 &&
                e.target.value?.includes('.')
            ) {
                return addDomainBtn.removeAttribute('disabled')
            }
            addDomainBtn.setAttribute('disabled', true)
        });
    });

    const spanCloses = document.querySelectorAll('span.close');
    spanCloses.forEach(close => close.addEventListener("click", (e) => {
        main.style.display = 'flex';
        formAddDomain.style.display = 'none';
        formListDomain.style.display = 'none';
    }));

    const spanList = document.querySelector('span.list');
    spanList.addEventListener("click", async () => {
        main.style.display = 'none';
        formAddDomain.style.display = 'none';
        formListDomain.style.display = 'flex';
        const domainsUl = formListDomain.querySelector("ul");
        domainsUl.innerHTML = "";

        const storage = await chrome.storage.local.get()
        storage?.domainList
            // .filter(domain => !storage.defaultDomainList.includes(domain))
            .reverse()
            .forEach((domain, i) => {
                const li = document.createElement('li')
                li.innerHTML += `${i + 1} `;
                li.append(domain)
                li.innerHTML += ' ';

                if(!storage.defaultDomainList.includes(domain)) {
                    const span = document.createElement('span')
                    span.innerHTML = "&#x1F5D1;"
                    span.setAttribute('domain', domain)
                    span.classList.add('remove')

                    span.addEventListener('click', (e) => {
                        if (confirm("Deseja remover o domínio selecionado?")) {
                            chrome.runtime.sendMessage(
                                chrome.runtime.id,
                                { removeDomain: e.target.getAttribute('domain') },
                                () => e.target.parentNode.remove()
                            );
                        }
                    })

                    li.append(span)
                }

                domainsUl.append(li)
            });
    });
});