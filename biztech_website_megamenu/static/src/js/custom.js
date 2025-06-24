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
                $('div.o_extra_menu_items .dropdown').on('click',function(event) {
                    event.stopPropagation();
                    $(this).find('.dropdown-menu').slideToggle();
                });
            },100)
        // close opened List catefory menus on loading if its mobile view
        if ( $(window).width() < 768) {
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
            $('li.o_extra_menu_items .dropdown').on('click',function(event) {
                event.stopPropagation();
                $(this).find('.dropdown-menu').slideToggle();

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

