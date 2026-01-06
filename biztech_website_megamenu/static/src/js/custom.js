/** @odoo-module */
import PublicWidget from "@web/legacy/js/public/public_widget";
import { rpc } from "@web/core/network/rpc";

export const mega_menu = PublicWidget.Widget.extend({
    selector: '#wrapwrap',

    init() {
        this._super(...arguments);
        $('.mega-dropdown-menu').click(function(e) {
            e.stopPropagation();
        })

            setTimeout(function(){
                $('li.li-mega-menu').on('click',function(event) {
                    var sliderTwo = $('.mm-carousel-slider .carousel').carousel({
                        /* your options for slider #2 */
                    })
                    $(".mm-carousel-slider .carousel-control").click(function (e) {
                        var index = $(this).data('bs-slide');
                        sliderTwo.carousel(index);
                        e.preventDefault();
                    });
                });
            },100)
        // close opened List catefory menus on loading if its mobile view
        if ( $(window).width() < 992) {
            $('.main_category').each(function() {
                var $each_header = $(this).parent().parent().find('li')

                // to close opened menu
                if ( $(this).parent().hasClass('active') == true ){
                    $(this).parent().next('.category_container').addClass('o_hidden');
                    $(this).parent().removeClass('active');
                    return true
                }
            });
        }
        $('.main_category').click(function(event) {
            event.stopImmediatePropagation();
            var $each_header = $(this).parent().parent().find('li')

            // to close opened menu
            if ( $(this).parent().hasClass('active') == true ){
                $(this).parent().next('.category_container').addClass('o_hidden');
                $(this).parent().removeClass('active');
                return true
            }
            $each_header.removeClass('active');
            $(this).parent().addClass('active');
            var $parent_container = $(this).parent().parent().parent().parent()
            var clicked_cat_id = parseInt($(this).attr('id'));
            $parent_container.find('.category_container').each(function() {
                var cat_id = parseInt($(this).attr('name'));
                if (cat_id == clicked_cat_id) {
                    $(this).removeClass('o_hidden');
                } else {
                    $(this).addClass('o_hidden');
                }
            });
        });


        $('.list_cat_megamenu, .cat_megamenu, .pages_megamenu, .pages_megamenu_pro_max, .pages_category_megamenu').each(function() {
            var list_cat_selector = this

            $(list_cat_selector).on('click', '.second-category', function(e) {
                var redirect_to = $(this).find('a').first().attr('href')
                window.location.href = redirect_to
            });

            $(list_cat_selector).on('click', '.first-category-dd', function(e) {
                var $child = $(this).parent().find('.second-category');
                var $ripple = $(this).parent().find('.ripple');
                var ripple_time = 1000;
                if ($ripple.length > 0){

                    $ripple.addClass('ripple_animated');
                    setTimeout(function(){
                        $ripple.removeClass('ripple_animated');
                    }, ripple_time);
                }

                if ($(this).parent().hasClass('open') == true) {
                    $(this).parent().parent().find('li').removeClass('open');
                    $(this).parent().parent().parent().removeClass('o_sub_opened');

                } else {
                    $(this).parent().parent().parent().parent().find('li').removeClass('o_sub_opened');
                    $(this).parent().parent().parent().parent().find('.categories, .first-category-dd').removeClass('open');
                    $(this).parent().parent().parent().addClass('o_sub_opened');
                    $(this).parent().addClass('open');
                }
            });
        });
        setTimeout(function(){
            $('header.o_header_affix .list_cat_megamenu,header.o_header_affix .cat_megamenu,header.o_header_affix .pages_megamenu','o_header_affix .pages_megamenu_pro_max','o_header_affix .pages_category_megamenu').each(function() {
                var list_cat_selector = this

                $(list_cat_selector).on('click', '.second-category', function(e) {
                    var redirect_to = $(this).find('a').first().attr('href')
                    window.location.href = redirect_to
                });

                $(list_cat_selector).on('click', '.first-category-dd', function(e) {
                    var $child = $(this).parent().find('.second-category');

                    var $ripple = $(this).parent().find('.ripple');
                    var ripple_time = 1000;
                    if ($ripple.length > 0){

                        $ripple.addClass('ripple_animated');
                        setTimeout(function(){
                            $ripple.removeClass('ripple_animated');
                        }, ripple_time);
                    }

                    if ($(this).parent().hasClass('open') == true) {
                        $(this).parent().parent().find('li').removeClass('open');
                        $(this).parent().parent().parent().removeClass('o_sub_opened');

                    } else {
                        $(this).parent().parent().parent().parent().find('li').removeClass('o_sub_opened');
                        $(this).parent().parent().parent().parent().find('.categories, .first-category-dd').removeClass('open');
                        $(this).parent().parent().parent().addClass('o_sub_opened');
                        $(this).parent().addClass('open');
                    }
                });
            });

            $('.o_extra_menu_items li.dropdown-menu').css('display','none');
            
            // Disable Bootstrap dropdown for extra menu items to prevent conflicts
            $('.o_extra_menu_items .dropdown-toggle').removeAttr('data-bs-toggle');
            
            // Remove any existing handlers to prevent double-toggling
            $('.o_extra_menu_items .dropdown-toggle, .o_extra_menu_items, li.o_extra_menu_items, div.o_extra_menu_items').off('click.megamenu');
            
            // Use a flag to prevent rapid toggling
            var isTogglingExtraMenu = false;
            
            // Handler for extra menu toggle
            function toggleExtraMenu(event) {
                event.stopPropagation();
                event.stopImmediatePropagation();
                event.preventDefault();
                
                // Prevent rapid clicking
                if (isTogglingExtraMenu) {
                    return false;
                }
                
                // Get the main dropdown menu
                var $extraMenuItems = $('.o_extra_menu_items');
                var $dropdownMenu = $extraMenuItems.find('> .dropdown-menu').first();
                
                if (!$dropdownMenu.length) {
                    $dropdownMenu = $extraMenuItems.children('.dropdown-menu').first();
                }
                
                // Check if menu is currently visible
                var isVisible = $dropdownMenu.is(':visible') || $extraMenuItems.hasClass('show') || $dropdownMenu.hasClass('show');
                
                isTogglingExtraMenu = true;
                
                if (isVisible) {
                    // Close the menu
                    $extraMenuItems.removeClass('show');
                    $dropdownMenu.removeClass('show');
                    $dropdownMenu.slideUp(300, function() {
                        isTogglingExtraMenu = false;
                    });
                } else {
                    // Close ALL other open menus in the navbar first to prevent overlap
                    // Close other mega menu dropdowns
                    $('.li-mega-menu.show').removeClass('show');
                    $('.li-mega-menu .dropdown-menu.show').removeClass('show').slideUp();
                    
                    // Close Bootstrap dropdowns
                    $('.navbar .dropdown.show').removeClass('show');
                    $('.navbar .dropdown-menu.show').removeClass('show').slideUp();
                    
                    // Close other extra menu items if any
                    $('.o_extra_menu_items').not($extraMenuItems).removeClass('show');
                    $('.o_extra_menu_items > .dropdown-menu').not($dropdownMenu).removeClass('show').slideUp();
                    
                    // Close any other navbar dropdowns
                    $('.navbar-nav .dropdown.show').removeClass('show');
                    $('.navbar-nav .dropdown-menu.show').removeClass('show').slideUp();
                    
                    // Small delay to ensure other menus are closed before opening this one
                    setTimeout(function() {
                        // Open this menu
                        $extraMenuItems.addClass('show');
                        $dropdownMenu.addClass('show');
                        $dropdownMenu.slideDown(300, function() {
                            isTogglingExtraMenu = false;
                        });
                    }, 50);
                }
                
                return false;
            }
            
            // Attach handler to dropdown toggle button (the plus icon)
            $('.o_extra_menu_items .dropdown-toggle').on('click.megamenu', function(event) {
                toggleExtraMenu(event);
            });
            
            // Also handle clicks on the dropdown container (if the plus icon is the container itself)
            $('.o_extra_menu_items.dropdown, li.o_extra_menu_items.dropdown').on('click.megamenu', function(event) {
                // Only handle if clicking on the container itself, not on menu items inside
                if (!$(event.target).closest('.dropdown-menu').length || 
                    $(event.target).closest('.dropdown-toggle').length) {
                    toggleExtraMenu(event);
                }
            });
            
            // Close extra menu when other navbar menus are opened
            $(document).on('click.megamenu-close-extra', '.navbar .dropdown-toggle:not(.o_extra_menu_items .dropdown-toggle), .li-mega-menu .dropdown-toggle', function(event) {
                var $extraMenuItems = $('.o_extra_menu_items');
                var $dropdownMenu = $extraMenuItems.find('> .dropdown-menu').first();
                
                if (!$dropdownMenu.length) {
                    $dropdownMenu = $extraMenuItems.children('.dropdown-menu').first();
                }
                
                // Check if extra menu is currently visible
                var isExtraMenuVisible = $dropdownMenu.is(':visible') || $extraMenuItems.hasClass('show') || $dropdownMenu.hasClass('show');
                
                // If extra menu is open, close it
                if (isExtraMenuVisible && !isTogglingExtraMenu) {
                    isTogglingExtraMenu = true;
                    $extraMenuItems.removeClass('show');
                    $dropdownMenu.removeClass('show');
                    $dropdownMenu.slideUp(300, function() {
                        isTogglingExtraMenu = false;
                    });
                }
            });
            
            // Close menu when clicking outside of it
            $(document).on('click.megamenu-outside', function(event) {
                // Get the menu elements
                var $extraMenuItems = $('.o_extra_menu_items');
                var $dropdownMenu = $extraMenuItems.find('> .dropdown-menu').first();
                
                if (!$dropdownMenu.length) {
                    $dropdownMenu = $extraMenuItems.children('.dropdown-menu').first();
                }
                
                // Check if menu is currently visible
                var isMenuVisible = $dropdownMenu.is(':visible') || $extraMenuItems.hasClass('show') || $dropdownMenu.hasClass('show');
                
                if (!isMenuVisible) {
                    return; // Menu is not open, no need to check
                }
                
                // Check if click is inside the menu area (toggle button, container, or dropdown menu content)
                var $target = $(event.target);
                var isClickInside = $target.closest('.o_extra_menu_items').length > 0 ||
                                   $target.closest('.o_extra_menu_items .dropdown-toggle').length > 0 ||
                                   $target.closest('.o_extra_menu_items > .dropdown-menu').length > 0;
                
                // If click is outside and menu is visible, close it
                if (!isClickInside && !isTogglingExtraMenu) {
                    isTogglingExtraMenu = true;
                    $extraMenuItems.removeClass('show');
                    $dropdownMenu.removeClass('show');
                    $dropdownMenu.slideUp(300, function() {
                        isTogglingExtraMenu = false;
                    });
                }
            });
            
            $('li.o_extra_menu_items li.li-mega-menu').on('click',function(event) {
                event.stopImmediatePropagation();
                $(this).find('ul.dropdown-menu').slideToggle();
            });
            $('li.o_extra_menu_items li.li-mega-menu span.fa-chevron-right').on('click',function(event) {
                event.stopImmediatePropagation();
                $(this).closest('li').toggleClass('open');
            });
            $('li.o_extra_menu_items li.li-mega-menu span.fa-chevron-left').on('click',function(event) {
                event.stopImmediatePropagation();
                $(this).closest('li').toggleClass('open');
            });
            $('li.o_extra_menu_items li.li-mega-menu i.fa-chevron-right').on('click',function(event) {
                event.stopPropagation();
                $('li.apt_cat_megamenu div.slide').carousel('next');
            });
            $('li.o_extra_menu_items li.li-mega-menu i.fa-chevron-left').on('click',function(event) {
                event.stopPropagation();
                $('li.apt_cat_megamenu div.slide').carousel('prev');
            });
        },500);
    },
});

PublicWidget.registry.mega_menu = mega_menu;

