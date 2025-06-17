/** @odoo-module */

import { Component, onMounted } from "@odoo/owl";
import { registry } from "@web/core/registry";

class MegaMenuComponent extends Component {
    setup() {
        onMounted(() => {
            this.initializeMegaMenu();
        });
    }

    initializeMegaMenu() {
        // Prevent propagation on mega-dropdown
        document.querySelectorAll('.mega-dropdown-menu').forEach(menu => {
            menu.addEventListener('click', e => e.stopPropagation());
        });

        // Handle dropdown toggles
        document.querySelectorAll('div.o_extra_menu_items .dropdown').forEach(dropdown => {
            dropdown.addEventListener('click', e => {
                e.stopPropagation();
                const menu = dropdown.querySelector('.dropdown-menu');
                if (menu) {
                    menu.classList.toggle('show');
                }
            });
        });

        // Handle carousel inside mega-menu
        document.querySelectorAll('li.li-mega-menu').forEach(item => {
            item.addEventListener('click', () => {
                const carousel = item.querySelector('.mm-carousel-slider .carousel');
                if (carousel) {
                    const bsCarousel = bootstrap.Carousel.getOrCreateInstance(carousel);
                    item.querySelectorAll('.carousel-control').forEach(control => {
                        control.addEventListener('click', e => {
                            const index = control.dataset.bsSlide;
                            if (index) {
                                bsCarousel.to(parseInt(index));
                                e.preventDefault();
                            }
                        });
                    });
                }
            });
        });

        // Handle main category toggles (mobile)
        if (window.innerWidth < 768) {
            document.querySelectorAll('.main_category').forEach(cat => {
                const parent = cat.closest('li');
                if (parent?.classList.contains('active')) {
                    parent.classList.remove('active');
                    const container = parent.querySelector('.category_container');
                    if (container) container.classList.add('o_hidden');
                }
            });
        }

        // Category click handler
        document.querySelectorAll('.main_category').forEach(cat => {
            cat.addEventListener('click', e => {
                e.stopImmediatePropagation();

                const parentLi = cat.closest('li');
                const siblingLis = cat.closest('ul')?.querySelectorAll('li') || [];

                if (parentLi.classList.contains('active')) {
                    parentLi.classList.remove('active');
                    parentLi.querySelector('.category_container')?.classList.add('o_hidden');
                    return;
                }

                siblingLis.forEach(li => li.classList.remove('active'));
                parentLi.classList.add('active');

                const catId = parseInt(cat.id);
                const allContainers = cat.closest('section')?.querySelectorAll('.category_container') || [];

                allContainers.forEach(container => {
                    const id = parseInt(container.getAttribute('name'));
                    if (id === catId) {
                        container.classList.remove('o_hidden');
                    } else {
                        container.classList.add('o_hidden');
                    }
                });
            });
        });

        // Mega-menu category handling
        const handleCategoryMenu = (selector) => {
            document.querySelectorAll(selector).forEach(menu => {
                menu.addEventListener('click', e => {
                    if (e.target.classList.contains('second-category')) {
                        const link = e.target.querySelector('a');
                        if (link?.href) window.location.href = link.href;
                    }

                    if (e.target.classList.contains('first-category-dd')) {
                        const li = e.target.closest('li');
                        const ripple = li?.querySelector('.ripple');
                        ripple?.classList.add('ripple_animated');
                        setTimeout(() => ripple?.classList.remove('ripple_animated'), 1000);

                        if (li?.classList.contains('open')) {
                            li.classList.remove('open');
                            li.closest('ul')?.querySelectorAll('li').forEach(l => l.classList.remove('open'));
                            li.closest('section')?.classList.remove('o_sub_opened');
                        } else {
                            li.closest('ul')?.querySelectorAll('li').forEach(l => l.classList.remove('open'));
                            li.closest('section')?.classList.add('o_sub_opened');
                            li.classList.add('open');
                        }
                    }
                });
            });
        };

        handleCategoryMenu('.list_cat_megamenu, .cat_megamenu, .pages_megamenu, .pages_megamenu_pro_max, .pages_category_megamenu');

        // Odoo header-specific carousel and dropdown logic
        setTimeout(() => {
            const selectors = 'header.o_header_affix .list_cat_megamenu, header.o_header_affix .cat_megamenu, header.o_header_affix .pages_megamenu, header.o_header_affix .pages_megamenu_pro_max, header.o_header_affix .pages_category_megamenu';
            handleCategoryMenu(selectors);

            // Dropdown toggle and carousel
            document.querySelectorAll('.o_extra_menu_items li.dropdown-menu').forEach(menu => {
                menu.style.display = 'none';
            });

            document.querySelectorAll('li.o_extra_menu_items .dropdown').forEach(drop => {
                drop.addEventListener('click', e => {
                    e.stopPropagation();
                    const menu = drop.querySelector('.dropdown-menu');
                    if (menu) menu.classList.toggle('show');
                });
            });

            const toggleSlide = (selector, direction) => {
                document.querySelectorAll(selector).forEach(icon => {
                    icon.addEventListener('click', e => {
                        e.stopPropagation();
                        const carousel = icon.closest('li')?.querySelector('div.slide');
                        if (carousel) {
                            const bsCarousel = bootstrap.Carousel.getOrCreateInstance(carousel);
                            direction === 'next' ? bsCarousel.next() : bsCarousel.prev();
                        }
                    });
                });
            };

            toggleSlide('li.o_extra_menu_items li.li-mega-menu i.fa-chevron-right', 'next');
            toggleSlide('li.o_extra_menu_items li.li-mega-menu i.fa-chevron-left', 'prev');

            ['.fa-chevron-right', '.fa-chevron-left'].forEach(sel => {
                document.querySelectorAll(`li.o_extra_menu_items li.li-mega-menu span${sel}`).forEach(icon => {
                    icon.addEventListener('click', e => {
                        e.stopImmediatePropagation();
                        icon.closest('li')?.classList.toggle('open');
                    });
                });
            });
        }, 500);
    }
}

// Register in Odoo's OWL component system
registry.category("web.components").add("MegaMenuComponent", MegaMenuComponent);