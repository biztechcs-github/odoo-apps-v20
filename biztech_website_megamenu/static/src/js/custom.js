import { Interaction } from "@web/public/interaction";
import { registry } from "@web/core/registry";
import { usePlugin } from "@odoo/owl";
import { BootstrapInstance } from "@web/core/utils/bootstrap_plugin";

const MOBILE_BREAKPOINT = 992;
const RIPPLE_TIME = 1000;
const SLIDE_DURATION = 300;

/**
 * jQuery's slideUp/slideDown are gone with jQuery in Odoo 20, so the show/hide
 * transition is driven here from the element's own scroll height.
 */
function slideDown(el, duration = SLIDE_DURATION) {
    el.style.removeProperty("display");
    if (getComputedStyle(el).display === "none") {
        el.style.display = "block";
    }
    el.style.overflow = "hidden";
    el.style.height = "0px";
    const target = el.scrollHeight;
    el.style.transition = `height ${duration}ms ease`;
    requestAnimationFrame(() => {
        el.style.height = `${target}px`;
    });
    return new Promise((resolve) => {
        setTimeout(() => {
            ["height", "overflow", "transition"].forEach((p) => el.style.removeProperty(p));
            resolve();
        }, duration);
    });
}

function slideUp(el, duration = SLIDE_DURATION) {
    el.style.overflow = "hidden";
    el.style.height = `${el.offsetHeight}px`;
    el.style.transition = `height ${duration}ms ease`;
    requestAnimationFrame(() => {
        el.style.height = "0px";
    });
    return new Promise((resolve) => {
        setTimeout(() => {
            el.style.display = "none";
            ["height", "overflow", "transition"].forEach((p) => el.style.removeProperty(p));
            resolve();
        }, duration);
    });
}

function isVisible(el) {
    return !!el && !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
}

export class MegaMenu extends Interaction {
    static selector = "#wrapwrap";

    dynamicContent = {
        ".mega-dropdown-menu": { "t-on-click.stop": () => {} },
        "li.li-mega-menu": { "t-on-click": (ev) => this.onMegaMenuClick(ev) },
        ".mm-carousel-slider .carousel-control": {
            "t-on-click.prevent.stop": (ev) => this.onCarouselControlClick(ev),
        },
        ".main_category": { "t-on-click.stop": (ev) => this.onMainCategoryClick(ev) },
        ".second-category": { "t-on-click": (ev) => this.onSecondCategoryClick(ev) },
        ".first-category-dd": { "t-on-click": (ev) => this.onFirstCategoryClick(ev) },
        ".o_extra_menu_items .dropdown-toggle": {
            "t-on-click.prevent.stop": () => this.toggleExtraMenu(),
        },
        "li.o_extra_menu_items li.li-mega-menu": {
            "t-on-click.stop": (ev) => this.onExtraMenuItemClick(ev),
        },
        "li.o_extra_menu_items li.li-mega-menu span.fa-chevron-right, li.o_extra_menu_items li.li-mega-menu span.fa-chevron-left": {
            "t-on-click.stop": (ev) => ev.target.closest("li")?.classList.toggle("open"),
        },
        "li.o_extra_menu_items li.li-mega-menu i.fa-chevron-right": {
            "t-on-click.stop": () => this.slideCategoryCarousel("next"),
        },
        "li.o_extra_menu_items li.li-mega-menu i.fa-chevron-left": {
            "t-on-click.stop": () => this.slideCategoryCarousel("prev"),
        },
        _document: { "t-on-click": (ev) => this.onDocumentClick(ev) },
    };

    setup() {
        this.bootstrap = usePlugin(BootstrapInstance);
        this.isTogglingExtraMenu = false;
    }

    start() {
        // Close category menus that render open, on mobile only.
        if (window.innerWidth < MOBILE_BREAKPOINT) {
            for (const mainCategoryEl of this.el.querySelectorAll(".main_category")) {
                const parentEl = mainCategoryEl.parentElement;
                if (parentEl?.classList.contains("active")) {
                    parentEl.nextElementSibling?.classList.add("o_hidden");
                    parentEl.classList.remove("active");
                }
            }
        }
        // Odoo's own dropdown would fight the custom open/close below.
        for (const toggleEl of this.el.querySelectorAll(".o_extra_menu_items .dropdown-toggle")) {
            toggleEl.removeAttribute("data-bs-toggle");
        }
        for (const menuEl of this.el.querySelectorAll(".o_extra_menu_items li.dropdown-menu")) {
            menuEl.style.display = "none";
        }
    }

    get extraMenuEl() {
        return this.el.querySelector(".o_extra_menu_items");
    }

    get extraDropdownEl() {
        const extraMenuEl = this.extraMenuEl;
        return extraMenuEl?.querySelector(":scope > .dropdown-menu");
    }

    onMegaMenuClick() {
        const carouselEl = this.el.querySelector(".mm-carousel-slider .carousel");
        if (carouselEl) {
            this.bootstrap.getOrCreateInstance(window.Carousel, carouselEl);
        }
    }

    onCarouselControlClick(ev) {
        const controlEl = ev.target.closest(".carousel-control");
        const carouselEl = controlEl?.closest(".mm-carousel-slider")?.querySelector(".carousel");
        if (!carouselEl) {
            return;
        }
        const carousel = this.bootstrap.getOrCreateInstance(window.Carousel, carouselEl);
        const slide = controlEl.dataset.bsSlide;
        if (slide === "next" || slide === "prev") {
            carousel[slide]();
        } else if (slide !== undefined) {
            carousel.to(parseInt(slide));
        }
    }

    onMainCategoryClick(ev) {
        const mainCategoryEl = ev.target.closest(".main_category");
        const parentEl = mainCategoryEl.parentElement;

        // Clicking the open category closes it again.
        if (parentEl.classList.contains("active")) {
            parentEl.nextElementSibling?.classList.add("o_hidden");
            parentEl.classList.remove("active");
            return;
        }
        for (const liEl of parentEl.parentElement.querySelectorAll("li")) {
            liEl.classList.remove("active");
        }
        parentEl.classList.add("active");

        const clickedCatId = parseInt(mainCategoryEl.getAttribute("id"));
        const containerEl = parentEl.parentElement.parentElement.parentElement;
        for (const categoryEl of containerEl.querySelectorAll(".category_container")) {
            const catId = parseInt(categoryEl.getAttribute("name"));
            categoryEl.classList.toggle("o_hidden", catId !== clickedCatId);
        }
    }

    onSecondCategoryClick(ev) {
        const linkEl = ev.target.closest(".second-category")?.querySelector("a");
        if (linkEl?.getAttribute("href")) {
            window.location.href = linkEl.getAttribute("href");
        }
    }

    onFirstCategoryClick(ev) {
        const firstCategoryEl = ev.target.closest(".first-category-dd");
        const parentEl = firstCategoryEl.parentElement;

        const rippleEl = parentEl.querySelector(".ripple");
        if (rippleEl) {
            rippleEl.classList.add("ripple_animated");
            this.waitForTimeout(() => rippleEl.classList.remove("ripple_animated"), RIPPLE_TIME);
        }

        if (parentEl.classList.contains("open")) {
            for (const liEl of parentEl.parentElement.querySelectorAll("li")) {
                liEl.classList.remove("open");
            }
            parentEl.parentElement.parentElement?.classList.remove("o_sub_opened");
        } else {
            const scopeEl = parentEl.parentElement.parentElement.parentElement;
            for (const liEl of scopeEl.querySelectorAll("li")) {
                liEl.classList.remove("o_sub_opened");
            }
            for (const openEl of scopeEl.querySelectorAll(".categories, .first-category-dd")) {
                openEl.classList.remove("open");
            }
            parentEl.parentElement.parentElement.classList.add("o_sub_opened");
            parentEl.classList.add("open");
        }
    }

    onExtraMenuItemClick(ev) {
        const dropdownEl = ev.target.closest("li.li-mega-menu")?.querySelector("ul.dropdown-menu");
        if (!dropdownEl) {
            return;
        }
        if (isVisible(dropdownEl)) {
            slideUp(dropdownEl);
        } else {
            slideDown(dropdownEl);
        }
    }

    slideCategoryCarousel(direction) {
        const carouselEl = this.el.querySelector("li.apt_cat_megamenu div.slide");
        if (carouselEl) {
            this.bootstrap.getOrCreateInstance(window.Carousel, carouselEl)[direction]();
        }
    }

    async toggleExtraMenu() {
        const extraMenuEl = this.extraMenuEl;
        const dropdownEl = this.extraDropdownEl;
        if (!extraMenuEl || !dropdownEl || this.isTogglingExtraMenu) {
            return;
        }
        this.isTogglingExtraMenu = true;

        if (isVisible(dropdownEl) || extraMenuEl.classList.contains("show")) {
            await this.closeExtraMenu();
            return;
        }

        // Close every other navbar menu first, they would otherwise overlap.
        for (const openEl of this.el.querySelectorAll(
            ".li-mega-menu.show, .navbar .dropdown.show, .navbar-nav .dropdown.show"
        )) {
            openEl.classList.remove("show");
        }
        for (const openMenuEl of this.el.querySelectorAll(
            ".li-mega-menu .dropdown-menu.show, .navbar .dropdown-menu.show, .navbar-nav .dropdown-menu.show"
        )) {
            openMenuEl.classList.remove("show");
            slideUp(openMenuEl);
        }

        extraMenuEl.classList.add("show");
        dropdownEl.classList.add("show");
        await slideDown(dropdownEl);
        this.isTogglingExtraMenu = false;
    }

    async closeExtraMenu() {
        const extraMenuEl = this.extraMenuEl;
        const dropdownEl = this.extraDropdownEl;
        if (!extraMenuEl || !dropdownEl) {
            return;
        }
        this.isTogglingExtraMenu = true;
        extraMenuEl.classList.remove("show");
        dropdownEl.classList.remove("show");
        await slideUp(dropdownEl);
        this.isTogglingExtraMenu = false;
    }

    onDocumentClick(ev) {
        const extraMenuEl = this.extraMenuEl;
        const dropdownEl = this.extraDropdownEl;
        if (!extraMenuEl || !dropdownEl || this.isTogglingExtraMenu) {
            return;
        }
        if (!isVisible(dropdownEl) && !extraMenuEl.classList.contains("show")) {
            return;
        }
        // Another navbar menu opening, or a click outside, both close this one.
        const openedAnotherMenu = !!ev.target.closest(
            ".navbar .dropdown-toggle:not(.o_extra_menu_items .dropdown-toggle), .li-mega-menu .dropdown-toggle"
        );
        if (openedAnotherMenu || !ev.target.closest(".o_extra_menu_items")) {
            this.closeExtraMenu();
        }
    }
}

registry.category("public.interactions").add("biztech_website_megamenu.mega_menu", MegaMenu);
