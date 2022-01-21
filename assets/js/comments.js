// Static comments
// originally sourced from: https://github.com/eduardoboucas/popcorn/blob/gh-pages/js/main.js and https://github.com/travisdowns/travisdowns.github.io/blob/master/assets/main.js

document.getElementById('comment-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const formData = new URLSearchParams(new FormData(e.target));
    document.querySelectorAll('#comment-form .js-notice').forEach(node => node.classList.add('d-none'));
    const submitBtn = document.getElementById('comment-form-submit');
    const cancelReplyBtn = document.getElementById('cancel-comment-reply-link');
    submitBtn.blur()
    const fields = document.querySelectorAll('#comment-form-email, #comment-form-name, #comment-form-message');
    submitBtn.setAttribute("disabled", "disabled");
    cancelReplyBtn.classList.add("d-none");
    fields.forEach(node => setAttributes(node, {
        'disabled': '',
        'aria-disabled': 'disabled',
        'tabindex': '-1'
    }));
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
    fetch(this.action, {
        method: this.method,
        cache: 'no-cache',
        body: formData,
        referrerPolicy: 'no-referrer',
        headers: new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' })
    }).then(() => {
        submitBtn.innerHTML = 'Submitted';
        document.querySelector('#comment-form .js-notice.alert-success').classList.remove('d-none');
    }).catch(err => {
        console.log(err);
        submitBtn.innerHTML = 'Submit Comment';
        document.querySelector('#comment-form .js-notice.alert-danger').classList.remove('d-none');
        submitBtn.removeAttribute("disabled");
        cancelReplyBtn.classList.remove("d-none");
        fields.forEach(node => removeAttributes(node, ['disabled', 'aria-disabled', 'tabindex']));
    });

    return false;
});

function setAttributes(el, attrs) {
    for (var key in attrs) {
        el.setAttribute(key, attrs[key]);
    }
}

function removeAttributes(el, attrs) {
    attrs.forEach(attr => el.removeAttribute(attr));
}

// Staticman comment replies
// modified from Wordpress https://core.svn.wordpress.org/trunk/wp-includes/js/comment-reply.js
window.addComment = {
    moveForm: function (commId, parentId, respondId, postId, name) {
        var div, element, style, cssHidden,
            comm = document.getElementById(commId),
            respond = document.getElementById(respondId),
            cancel = document.getElementById('cancel-comment-reply-link'),
            parent = document.getElementById('comment-replying-to-uid'),
            post = document.getElementById('comment-post-slug'),
            commentForm = respond.getElementsByTagName('form')[0];

        if (!comm || !respond || !cancel || !parent || !commentForm) {
            return;
        }

        this.respondId = respondId;
        postId = postId || false;

        if (!document.getElementById('sm-temp-form-div')) {
            div = document.createElement('div');
            div.id = 'sm-temp-form-div';
            div.style.display = 'none';
            respond.parentNode.insertBefore(div, respond);
        }

        comm.parentNode.insertBefore(respond, comm.nextSibling);
        if (post && postId) {
            post.value = postId;
        }
        parent.value = parentId;
        document.querySelector('.page__section-label').innerHTML = 'Replying to ' + name;
        cancel.classList.remove('d-none');

        cancel.onclick = function () {
            let t = addComment,
                temp = document.getElementById('sm-temp-form-div'),
                respond = document.getElementById(t.respondId);

            if (!temp || !respond) {
                return;
            }

            document.getElementById('comment-replying-to-uid').value = '';
            temp.parentNode.insertBefore(respond, temp);
            temp.parentNode.removeChild(temp);
            document.querySelector('.page__section-label').innerHTML = 'Leave a Comment';
            cancel.classList.add('d-none');
            this.onclick = null;
            return false;
        };

        /*
            * Set initial focus to the first form focusable element.
            * Try/catch used just to avoid errors in IE 7- which return visibility
            * 'inherit' when the visibility value is inherited from an ancestor.
            */
        try {
            for (let i = 0; i < commentForm.elements.length; i++) {
                element = commentForm.elements[i];
                cssHidden = false;

                // Modern browsers.
                if ('getComputedStyle' in window) {
                    style = window.getComputedStyle(element);
                    // IE 8.
                } else if (document.documentElement.currentStyle) {
                    style = element.currentStyle;
                }

                /*
                    * For display none, do the same thing jQuery does. For visibility,
                    * check the element computed style since browsers are already doing
                    * the job for us. In fact, the visibility computed style is the actual
                    * computed value and already takes into account the element ancestors.
                    */
                if ((element.offsetWidth <= 0 && element.offsetHeight <= 0) || style.visibility === 'hidden') {
                    cssHidden = true;
                }

                // Skip form elements that are hidden or disabled.
                if ('hidden' === element.type || element.disabled || cssHidden) {
                    continue;
                }

                element.focus();
                // Stop after the first focusable element.
                break;
            }

        } catch (er) { }

        return false;
    }
}