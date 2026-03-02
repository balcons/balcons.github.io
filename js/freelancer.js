/*!
 * Start Bootstrap - Freelancer Bootstrap Theme (http://startbootstrap.com)
 * Code licensed under the Apache License v2.0.
 * For details, see http://www.apache.org/licenses/LICENSE-2.0.
 */

// jQuery for page scrolling feature - requires jQuery Easing plugin
$(function() {
    $('.page-scroll a').bind('click', function(event) {
        var $anchor = $(this);
        $('html, body').stop().animate({
            scrollTop: $($anchor.attr('href')).offset().top
        }, 1500, 'easeInOutExpo');
        event.preventDefault();
    });
});

// Floating label headings for the contact form
$(function() {
    $("body").on("input propertychange", ".floating-label-form-group", function(e) {
        $(this).toggleClass("floating-label-form-group-with-value", !! $(e.target).val());
    }).on("focus", ".floating-label-form-group", function() {
        $(this).addClass("floating-label-form-group-with-focus");
    }).on("blur", ".floating-label-form-group", function() {
        $(this).removeClass("floating-label-form-group-with-focus");
    });
});

// Highlight the top nav as scrolling occurs
$('body').scrollspy({
    target: '.navbar-fixed-top'
})

// Closes the Responsive Menu on Menu Item Click
$('.navbar-collapse ul li a').click(function() {
    $('.navbar-toggle:visible').click();
});

// Simple parallax effect for header artwork/text + portfolio reveal
$(window).on('scroll', function () {
    var $win = $(this);
    var scrollTop = $win.scrollTop();
    var winHeight = $win.height();

    var $header = $('header');
    if ($header.length) {
        var headerHeight = $header.outerHeight() || 1;
        var headerProgress = Math.min(scrollTop / headerHeight, 1);
        var headerTranslate = headerProgress * -40; // move content slightly upwards
        $header.find('.parallax-layer').css('transform', 'translateY(' + headerTranslate + 'px)');
    }

    // Portfolio image reveal + subtle parallax
    $('.portfolio-parallax-img').each(function () {
        var $img = $(this);
        var imgTop = $img.offset().top;
        var distance = imgTop - scrollTop;

        // When image is near or inside viewport, reveal it
        if (distance < winHeight * 0.9) {
            $img.addClass('is-visible');
        }

        if (!$img.hasClass('is-visible')) {
            return;
        }

        // Small vertical parallax based on position in viewport
        var normalized = (distance / winHeight) - 0.5; // -0.5 .. 0.5
        var offset = normalized * -20; // -10px .. 10px
        $img.css('transform', 'translateY(' + offset + 'px)');
    });
});

// Ensure initial state on load/resize
$(window).on('load resize', function () {
    $(window).trigger('scroll');
});
