// hero background (for fun)
// product images that float up behind the hero text and loop forever
// based on this GSAP code snippet: https://codepen.io/GreenSock/pen/rNEMjOL
const heroImages = document.querySelector("#heroImages");

// how many images float at the same time
const IMAGE_COUNT = 18;

function startHeroImages(list) {
    // if script didn't load, leave it plain
    if (typeof gsap === "undefined") return;

    heroImages.replaceChildren();

    // spread the picks across the whole list so we get a mix of categories
    const step = Math.floor(list.length / IMAGE_COUNT);

    for (let i = 0; i < IMAGE_COUNT; i++) {
        const p = list[i * step];

        // one image, positioned by GSAP (top left corner of the hero to start)
        const img = document.createElement("img");
        img.src = p.thumbnail;
        img.alt = "";
        img.classList.add("absolute", "top-0", "left-0", "w-24", "h-24", "object-cover");
        heroImages.appendChild(img);

        floatImage(img);
    }
}

// move one image from below the hero to above it, then start again
function floatImage(img) {
    const width = heroImages.offsetWidth;
    const height = heroImages.offsetHeight;
    const duration = gsap.utils.random(10, 18);

    // GSAP: set the starting position, size and fade
    gsap.set(img, {
        x: gsap.utils.random(0, width - 96),
        y: height,
        scale: gsap.utils.random(1.0, 1.6),
        rotation: gsap.utils.random(-10, 10),
        opacity: 1.0,
    });

    // GSAP: float up past the top while drifting sideways and turning a little.
    // repeat: -1 loops forever, and a random negative delay means the images
    // start part way up instead of all coming in from the bottom at once.
    gsap.to(img, {
        y: -150,
        x: "+=" + gsap.utils.random(-100, 100),
        rotation: "+=" + gsap.utils.random(-30, 30),
        duration: duration,
        ease: "none",
        repeat: -1,
        delay: -gsap.utils.random(0, duration)
    });
}

export { startHeroImages };
