let currentLoggedInUserId = null;

document.addEventListener('DOMContentLoaded', async function () {
    const blogSlug = window.location.pathname.split('/blog/')[1];

    if (!blogSlug) return;

    // Load initial interaction counts
    await loadInteractions();

    // The comment panel should always be viewable by anyone.
    // Unlink comment button from auth modal triggers.
    const commentBtn = document.querySelector('.interact-btn.comment');
    if (commentBtn) {
        commentBtn.classList.remove('trigger-auth-modal');
        commentBtn.removeAttribute('data-action');
        commentBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleCommentPanel();
        });
    }

    // Setup trigger-auth-modal buttons for non-logged-in users
    if (!isUserLoggedIn()) {
        setupAuthModalTriggers();
    } else {
        setupLoggedInInteractions(blogSlug);
    }

    // Always setup comment panel
    setupCommentPanel(blogSlug);
});

function setupCommentPanel(blogSlug) {
    const commentPanel = document.getElementById('commentPanel');
    if (!commentPanel) return;

    const closeBtn = commentPanel.querySelector('.comment-close-btn');
    const submitBtn = commentPanel.querySelector('.comment-submit-btn');
    const commentInput = commentPanel.querySelector('.comment-input');

    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleCommentPanel();
        });
    }

    // Helper to check auth before allowing interaction inside comment panel
    const requireAuthForInteraction = (e) => {
        if (!isUserLoggedIn()) {
            e.preventDefault();
            e.stopPropagation();
            if (commentInput) commentInput.blur();
            if (commentPanel.classList.contains('open')) {
                toggleCommentPanel();
            }
            sessionStorage.setItem('authAction', 'comment');
            openAuthModal();
            return false;
        }
        return true;
    };

    if (commentInput) {
        commentInput.addEventListener('focus', requireAuthForInteraction);
        commentInput.addEventListener('click', requireAuthForInteraction);
    }

    if (submitBtn) {
        submitBtn.addEventListener('click', (e) => {
            if (!requireAuthForInteraction(e)) {
                // If not logged in, auth modal opens. User wants comment panel to close in this specific case.
                if (commentPanel.classList.contains('open')) {
                    toggleCommentPanel();
                }
                return;
            }
            e.preventDefault();
            if (commentInput && commentInput.value.trim()) {
                addComment(blogSlug, commentInput.value);
            } else {
                alert('Please write a comment');
            }
        });
    }

    const signinBtn = commentPanel.querySelector('.comment-signin-btn');
    if (signinBtn) {
        signinBtn.addEventListener('click', (e) => {
            requireAuthForInteraction(e);
        });
    }

    // Click outside to close
    document.addEventListener('click', (e) => {
        if (commentPanel.classList.contains('open')) {
            const isClickInsidePanel = commentPanel.contains(e.target);
            const isClickOnToggleBtn = e.target.closest('.interact-btn.comment');
            const isClickInsideAuthModal = e.target.closest('#authModal');
            const isClickInsideConfirmModal = e.target.closest('#customConfirmModal');
            // If they clicked outside the panel AND not on the button that opens it AND not inside auth modal or confirm modal
            if (!isClickInsidePanel && !isClickOnToggleBtn && !isClickInsideAuthModal && !isClickInsideConfirmModal) {
                toggleCommentPanel();
            }
        }
    });

    // Drag to close (mobile bottom sheet)
    let startY = 0;
    let currentY = 0;
    let isDragging = false;
    const header = commentPanel.querySelector('.comment-panel-header');

    if (header) {
        header.addEventListener('touchstart', (e) => {
            // Only apply on mobile where it behaves as a bottom sheet
            if (window.innerWidth > 768) return;
            startY = e.touches[0].clientY;
            isDragging = true;
            commentPanel.style.transition = 'none'; // Disable transition for smooth dragging
        }, { passive: true });

        header.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            currentY = e.touches[0].clientY;
            const deltaY = currentY - startY;

            // Only allow dragging down
            if (deltaY > 0) {
                commentPanel.style.transform = `translateY(${deltaY}px)`;
            }
        }, { passive: true });

        header.addEventListener('touchend', (e) => {
            if (!isDragging) return;
            isDragging = false;
            commentPanel.style.transition = ''; // Restore CSS transition

            const deltaY = currentY - startY;

            // If dragged down more than 80px, close it
            if (deltaY > 80) {
                commentPanel.style.transform = '';
                toggleCommentPanel();
            } else {
                // Snap back
                commentPanel.style.transform = '';
            }
        });
    }
}

function setupAuthModalTriggers() {
    const triggerBtns = document.querySelectorAll('.trigger-auth-modal');
    triggerBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const action = btn.getAttribute('data-action');
            sessionStorage.setItem('authAction', action);
            openAuthModal();
        });
    });
}

function setupLoggedInInteractions(blogSlug) {
    // Remove trigger-auth-modal class and add actual handlers
    const likeBtn = document.querySelector('.interact-btn.like');
    if (likeBtn) {
        likeBtn.classList.remove('trigger-auth-modal');
        likeBtn.removeAttribute('data-action');
        likeBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await toggleLike(blogSlug);
        });
    }

    const dislikeBtn = document.querySelector('.interact-btn.dislike');
    if (dislikeBtn) {
        dislikeBtn.classList.remove('trigger-auth-modal');
        dislikeBtn.removeAttribute('data-action');
        dislikeBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await toggleDislike(blogSlug);
        });
    }
}

async function toggleLike(blogSlug) {
    try {
        const response = await fetch(`/blogs/${blogSlug}/like`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success) {
            const likeBtn = document.querySelector('.interact-btn.like');
            const likeIcon = likeBtn.querySelector('.blog-interact-icon');

            if (data.liked) {
                likeIcon.src = '/image/like-icon-filled.png';
                likeBtn.classList.add('liked');
            } else {
                likeIcon.src = '/image/like-icon.png';
                likeBtn.classList.remove('liked');
            }

            updateLikeCount(data.likeCount);

            if (data.dislikeCount !== undefined) {
                updateDislikeCount(data.dislikeCount);
                const dislikeBtn = document.querySelector('.interact-btn.dislike');
                if (dislikeBtn && data.liked) {
                    dislikeBtn.classList.remove('disliked');
                    const dislikeIcon = dislikeBtn.querySelector('.blog-interact-icon');
                    if (dislikeIcon) dislikeIcon.src = '/image/dislike.png';
                }
            }
        }
    } catch (error) {
        console.error('Error toggling like:', error);
        alert('Failed to process your like. Please try again.');
    }
}

async function toggleDislike(blogSlug) {
    try {
        const response = await fetch(`/blogs/${blogSlug}/dislike`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success) {
            const dislikeBtn = document.querySelector('.interact-btn.dislike');
            const dislikeIcon = dislikeBtn.querySelector('.blog-interact-icon');

            if (data.disliked) {
                dislikeIcon.src = '/image/dislike-filled.png';
                dislikeBtn.classList.add('disliked');
            } else {
                dislikeIcon.src = '/image/dislike.png';
                dislikeBtn.classList.remove('disliked');
            }

            updateDislikeCount(data.dislikeCount);

            if (data.likeCount !== undefined) {
                updateLikeCount(data.likeCount);
                const likeBtn = document.querySelector('.interact-btn.like');
                if (likeBtn && data.disliked) {
                    likeBtn.classList.remove('liked');
                    const likeIcon = likeBtn.querySelector('.blog-interact-icon');
                    if (likeIcon) likeIcon.src = '/image/like-icon.png';
                }
            }
        }
    } catch (error) {
        console.error('Error toggling dislike:', error);
        alert('Failed to process your dislike. Please try again.');
    }
}

async function addComment(blogSlug, commentText) {
    try {
        const response = await fetch(`/blogs/${blogSlug}/comment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ comment: commentText })
        });

        const data = await response.json();

        if (data.success) {
            displayComment(data.comment, true);
            updateCommentCount(data.commentCount);

            const commentPanel = document.getElementById('commentPanel');
            const commentInput = commentPanel.querySelector('.comment-input');
            if (commentInput) commentInput.value = '';

            return true;
        } else {
            alert(data.message || 'Failed to add comment');
            return false;
        }
    } catch (error) {
        console.error('Error adding comment:', error);
        alert('Error adding comment');
        return false;
    }
}

async function deleteComment(blogSlug, commentId) {
    const confirmed = await window.customConfirm(
        'Delete Comment',
        'Are you sure you want to delete this comment?'
    );
    if (!confirmed) return;

    try {
        const response = await fetch(`/blogs/${blogSlug}/comment/${commentId}`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success) {
            const commentElement = document.querySelector(`.comment-item[data-comment-id="${commentId}"]`);
            if (commentElement) {
                commentElement.remove();
            }
            updateCommentCount(data.commentCount);
        } else {
            alert(data.message || 'Failed to delete comment');
        }
    } catch (error) {
        console.error('Error deleting comment:', error);
        alert('Error deleting comment');
    }
}

async function loadInteractions() {
    const blogSlug = window.location.pathname.split('/blog/')[1];

    try {
        const response = await fetch(`/blogs/${blogSlug}/interactions`, {
            headers: {
                'Accept': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success) {
            currentLoggedInUserId = data.currentUserId;

            updateLikeCount(data.likeCount);
            updateDislikeCount(data.dislikeCount);
            updateCommentCount(data.commentCount);

            if (data.userLiked) {
                const likeBtn = document.querySelector('.interact-btn.like');
                if (likeBtn) {
                    likeBtn.classList.add('liked');
                    const likeIcon = likeBtn.querySelector('.blog-interact-icon');
                    if (likeIcon) likeIcon.src = '/image/like-icon-filled.png';
                }
            }

            if (data.userDisliked) {
                const dislikeBtn = document.querySelector('.interact-btn.dislike');
                if (dislikeBtn) {
                    dislikeBtn.classList.add('disliked');
                    const dislikeIcon = dislikeBtn.querySelector('.blog-interact-icon');
                    if (dislikeIcon) dislikeIcon.src = '/image/dislike-filled.png';
                }
            }

            if (data.comments) {
                const commentContainer = document.querySelector('.comments-list');
                if (commentContainer) {
                    commentContainer.innerHTML = '';
                    data.comments.forEach(comment => displayComment(comment));
                }
            }
        }
    } catch (error) {
        console.error('Error loading interactions:', error);
    }
}

function updateLikeCount(count) {
    const likeBtn = document.querySelector('.interact-btn.like');
    if (likeBtn) {
        let countSpan = likeBtn.querySelector('.count');
        if (!countSpan) {
            countSpan = document.createElement('span');
            countSpan.className = 'count';
            likeBtn.appendChild(countSpan);
        }
        countSpan.textContent = count > 0 ? count : '';
    }
}

function updateDislikeCount(count) {
    const dislikeBtn = document.querySelector('.interact-btn.dislike');
    if (dislikeBtn) {
        let countSpan = dislikeBtn.querySelector('.count');
        if (countSpan) {
            countSpan.remove();
        }
    }
}

function updateCommentCount(count) {
    const commentBtn = document.querySelector('.interact-btn.comment');
    if (commentBtn) {
        let countSpan = commentBtn.querySelector('.count');
        if (!countSpan) {
            countSpan = document.createElement('span');
            countSpan.className = 'count';
            commentBtn.appendChild(countSpan);
        }
        countSpan.textContent = count > 0 ? count : '';
    }
}

function displayComment(comment, isPrepended = false) {
    const commentContainer = document.querySelector('.comments-list');
    if (!commentContainer) return;

    const commentElement = document.createElement('div');
    commentElement.className = 'comment-item';
    commentElement.setAttribute('data-comment-id', comment._id);

    let authorName = 'Anonymous';
    let commentOwnerId = null;
    let authorAvatar = '/image/avatar-sign.png';

    if (comment.userId) {
        if (typeof comment.userId === 'object') {
            authorName = comment.userId.name || comment.userId.adminName || 'Anonymous';
            commentOwnerId = comment.userId._id;
            authorAvatar = comment.userId.profileImage || comment.userId.adminImage || '/image/avatar-sign.png';
        } else {
            commentOwnerId = comment.userId;
        }
    }

    const commentDate = new Date(comment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const blogSlug = window.location.pathname.split('/blog/')[1];
    const isOwner = currentLoggedInUserId && commentOwnerId && currentLoggedInUserId === commentOwnerId.toString();

    let userLiked = false;
    let userDisliked = false;
    if (currentLoggedInUserId && comment.likes) {
        userLiked = comment.likes.some(l => l.userId === currentLoggedInUserId);
    }
    if (currentLoggedInUserId && comment.dislikes) {
        userDisliked = comment.dislikes.some(d => d.userId === currentLoggedInUserId);
    }
    
    const likeCount = comment.likes ? comment.likes.length : 0;
    const dislikeCount = comment.dislikes ? comment.dislikes.length : 0;

    commentElement.innerHTML = `
        <div class="comment-header">
            <div class="comment-user-info">
                <img class="comment-item-avatar" src="${authorAvatar}" alt="${escapeHtml(authorName)}">
                <div class="comment-user-meta">
                    <span class="comment-author">${escapeHtml(authorName)}</span>
                    <span class="comment-date">${commentDate}</span>
                </div>
            </div>
            ${isOwner ? `<button class="comment-delete-btn" data-blog-slug="${blogSlug}" data-comment-id="${comment._id}">Delete</button>` : ''}
        </div>
        <div class="comment-body">${escapeHtml(comment.comment)}</div>
        
        <div class="comment-interactions-bar">
            <button class="mini-interact-btn comment-like-btn ${userLiked ? 'active' : ''}" data-comment-id="${comment._id}">
                <img src="/image/${userLiked ? 'like-icon-filled.png' : 'like-icon.png'}" alt="like">
                <span class="count">${likeCount > 0 ? likeCount : ''}</span>
            </button>
            <button class="mini-interact-btn comment-dislike-btn ${userDisliked ? 'active' : ''}" data-comment-id="${comment._id}">
                <img src="/image/${userDisliked ? 'dislike-filled.png' : 'dislike.png'}" alt="dislike">
            </button>
            <button class="mini-interact-btn comment-reply-btn" data-comment-id="${comment._id}" data-replying-to="">
                <img src="/image/comment-icon.png" alt="reply">
                <span>Reply</span>
            </button>
        </div>
        
        <div class="reply-input-container hidden" id="reply-container-${comment._id}">
            <div class="reply-input-box">
                <textarea class="reply-input" id="reply-input-${comment._id}" placeholder="Write a reply..." rows="2"></textarea>
                <div class="reply-actions">
                    <button class="reply-cancel-btn" data-comment-id="${comment._id}">Cancel</button>
                    <button class="reply-submit-btn" data-comment-id="${comment._id}" data-blog-slug="${blogSlug}">Post</button>
                </div>
            </div>
        </div>
        
        <div class="replies-list" id="replies-${comment._id}"></div>
    `;

    if (isPrepended) {
        commentContainer.prepend(commentElement);
    } else {
        commentContainer.appendChild(commentElement);
    }

    const deleteBtn = commentElement.querySelector('.comment-delete-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function (e) {
            e.preventDefault();
            deleteComment(this.getAttribute('data-blog-slug'), this.getAttribute('data-comment-id'));
        });
    }

    const likeBtn = commentElement.querySelector('.comment-like-btn');
    if (likeBtn) likeBtn.addEventListener('click', (e) => toggleCommentLike(e, blogSlug, comment._id));

    const dislikeBtn = commentElement.querySelector('.comment-dislike-btn');
    if (dislikeBtn) dislikeBtn.addEventListener('click', (e) => toggleCommentDislike(e, blogSlug, comment._id));

    const replyBtn = commentElement.querySelector('.comment-reply-btn');
    const replyContainer = commentElement.querySelector(`#reply-container-${comment._id}`);
    const cancelBtn = commentElement.querySelector('.reply-cancel-btn');
    const submitReplyBtn = commentElement.querySelector('.reply-submit-btn');

    if (replyBtn) {
        replyBtn.addEventListener('click', () => {
            if (!isUserLoggedIn()) {
                sessionStorage.setItem('authAction', 'reply');
                openAuthModal();
                return;
            }
            const repliesList = commentElement.querySelector('.replies-list');
            const isCurrentlyInMain = replyContainer.parentNode === commentElement;
            const isHidden = replyContainer.classList.contains('hidden');
            
            if (isCurrentlyInMain && !isHidden) {
                replyContainer.classList.add('hidden');
            } else {
                commentElement.insertBefore(replyContainer, repliesList);
                submitReplyBtn.setAttribute('data-replying-to', '');
                replyContainer.querySelector('.reply-input').placeholder = 'Write a reply...';
                replyContainer.classList.remove('hidden');
                replyContainer.querySelector('.reply-input').focus();
            }
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            replyContainer.classList.add('hidden');
            commentElement.querySelector(`#reply-input-${comment._id}`).value = '';
        });
    }

    if (submitReplyBtn) {
        submitReplyBtn.addEventListener('click', () => {
            const replyText = commentElement.querySelector(`#reply-input-${comment._id}`).value;
            const replyingTo = submitReplyBtn.getAttribute('data-replying-to') || '';
            if (replyText.trim()) {
                addReply(blogSlug, comment._id, replyText, replyingTo);
            }
        });
    }

    if (comment.replies && comment.replies.length > 0) {
        let visibleCount = 0;
        const totalReplies = comment.replies.length;
        
        const repliesList = commentElement.querySelector('.replies-list');
        function handleToggleClick(e, action) {
            e.stopPropagation();
            
            if (action === 'hide') {
                const replyContainer = commentElement.querySelector(`#reply-container-${comment._id}`);
                if (replyContainer && repliesList.contains(replyContainer)) {
                    commentElement.insertBefore(replyContainer, repliesList);
                    replyContainer.classList.add('hidden');
                }
                const allReplies = repliesList.querySelectorAll('.tree-reply-item:not(.replies-toggle):not(.replies-toggle-bottom)');
                allReplies.forEach(el => el.remove());
                visibleCount = 0;
            } else if (action === 'view') {
                const nextBatch = comment.replies.slice(visibleCount, visibleCount + 6);
                nextBatch.forEach(reply => {
                    displayReply(blogSlug, comment._id, reply);
                });
                visibleCount += nextBatch.length;
            }
            updateToggleBtns();
        }
        
        function updateToggleBtns() {
            const totalReplies = comment.replies.length;
            
            // Clear existing toggle buttons
            const existingBtns = repliesList.querySelectorAll('.replies-toggle, .replies-toggle-bottom');
            existingBtns.forEach(el => el.remove());
            
            if (totalReplies === 0) return;
            
            if (visibleCount === 0) {
                const topBtn = document.createElement('div');
                topBtn.className = 'replies-toggle-item replies-toggle';
                topBtn.innerHTML = `<button class="view-more-replies-btn">-- view ${totalReplies} replies</button>`;
                topBtn.querySelector('button').addEventListener('click', (e) => handleToggleClick(e, 'view'));
                repliesList.prepend(topBtn);
            } else if (visibleCount < totalReplies) {
                const topBtn = document.createElement('div');
                topBtn.className = 'replies-toggle-item replies-toggle';
                topBtn.innerHTML = `<button class="view-more-replies-btn hide-replies">-- hide replies</button>`;
                topBtn.querySelector('button').addEventListener('click', (e) => handleToggleClick(e, 'hide'));
                repliesList.prepend(topBtn);
                
                const remaining = totalReplies - visibleCount;
                const bottomBtn = document.createElement('div');
                bottomBtn.className = 'replies-toggle-item replies-toggle-bottom';
                bottomBtn.innerHTML = `<button class="view-more-replies-btn">-- view more replies</button>`;
                bottomBtn.querySelector('button').addEventListener('click', (e) => handleToggleClick(e, 'view'));
                repliesList.appendChild(bottomBtn);
            } else {
                const topBtn = document.createElement('div');
                topBtn.className = 'replies-toggle-item replies-toggle';
                topBtn.innerHTML = `<button class="view-more-replies-btn hide-replies">-- hide replies</button>`;
                topBtn.querySelector('button').addEventListener('click', (e) => handleToggleClick(e, 'hide'));
                repliesList.prepend(topBtn);
            }
        }
        
        repliesList.addReplyLive = (newReply) => {
            comment.replies.push(newReply);
            if (visibleCount > 0) visibleCount++;
            updateToggleBtns();
        };
        
        repliesList.removeReplyLive = (replyId) => {
            comment.replies = comment.replies.filter(r => r._id !== replyId);
            if (visibleCount > 0) visibleCount--;
            updateToggleBtns();
        };
        
        updateToggleBtns();
    }
}

async function toggleCommentLike(e, blogSlug, commentId) {
    if (!isUserLoggedIn()) {
        sessionStorage.setItem('authAction', 'like');
        openAuthModal();
        return;
    }
    const btn = e.currentTarget;
    try {
        const response = await fetch(`/blogs/${blogSlug}/comment/${commentId}/like`, { method: 'POST', headers: { 'Accept': 'application/json' }});
        const data = await response.json();
        if (data.success) {
            const icon = btn.querySelector('img');
            const count = btn.querySelector('.count');
            if (data.liked) {
                btn.classList.add('active');
                icon.src = '/image/like-icon-filled.png';
            } else {
                btn.classList.remove('active');
                icon.src = '/image/like-icon.png';
            }
            if(count) count.textContent = data.likeCount > 0 ? data.likeCount : '';
            
            const dislikeBtn = document.querySelector(`.comment-dislike-btn[data-comment-id="${commentId}"]`);
            if (dislikeBtn && data.liked) {
                dislikeBtn.classList.remove('active');
                dislikeBtn.querySelector('img').src = '/image/dislike.png';
            }
        }
    } catch (err) { console.error('Error toggling comment like', err); }
}

async function toggleCommentDislike(e, blogSlug, commentId) {
    if (!isUserLoggedIn()) {
        sessionStorage.setItem('authAction', 'dislike');
        openAuthModal();
        return;
    }
    const btn = e.currentTarget;
    try {
        const response = await fetch(`/blogs/${blogSlug}/comment/${commentId}/dislike`, { method: 'POST', headers: { 'Accept': 'application/json' }});
        const data = await response.json();
        if (data.success) {
            const icon = btn.querySelector('img');
            if (data.disliked) {
                btn.classList.add('active');
                icon.src = '/image/dislike-filled.png';
            } else {
                btn.classList.remove('active');
                icon.src = '/image/dislike.png';
            }
            
            const likeBtn = document.querySelector(`.comment-like-btn[data-comment-id="${commentId}"]`);
            if (likeBtn && data.disliked) {
                likeBtn.classList.remove('active');
                likeBtn.querySelector('img').src = '/image/like-icon.png';
                const likeCountSpan = likeBtn.querySelector('.count');
                if(likeCountSpan) likeCountSpan.textContent = data.likeCount > 0 ? data.likeCount : '';
            }
        }
    } catch (err) { console.error('Error toggling comment dislike', err); }
}

async function addReply(blogSlug, commentId, replyText, replyingTo) {
    try {
        const response = await fetch(`/blogs/${blogSlug}/comment/${commentId}/reply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ reply: replyText, replyingTo: replyingTo })
        });
        const data = await response.json();
        if (data.success) {
            const repliesContainer = document.querySelector(`#replies-${commentId}`);
            if (repliesContainer && typeof repliesContainer.addReplyLive === 'function') {
                repliesContainer.addReplyLive(data.reply);
            }
            const replyContainer = document.querySelector(`#reply-container-${commentId}`);
            const targetReply = replyContainer ? replyContainer.closest('.tree-reply-item') : null;
            
            displayReply(blogSlug, commentId, data.reply, true, targetReply);
            
            if (replyContainer) {
                replyContainer.classList.add('hidden');
                document.querySelector(`#reply-input-${commentId}`).value = '';
            }
        } else {
            alert(data.message || 'Failed to add reply');
        }
    } catch (error) { console.error('Error adding reply:', error); }
}

function displayReply(blogSlug, commentId, reply, isPrepended = false, targetReply = null) {
    const repliesContainer = document.querySelector(`#replies-${commentId}`);
    if (!repliesContainer) return;

    const replyElement = document.createElement('div');
    replyElement.className = 'tree-reply-item';
    replyElement.setAttribute('data-reply-id', reply._id);

    let authorName = 'Anonymous';
    let replyOwnerId = null;
    let authorAvatar = '/image/avatar-sign.png';

    if (reply.userId) {
        if (typeof reply.userId === 'object') {
            authorName = reply.userId.name || reply.userId.adminName || 'Anonymous';
            replyOwnerId = reply.userId._id;
            authorAvatar = reply.userId.profileImage || reply.userId.adminImage || '/image/avatar-sign.png';
        } else {
            replyOwnerId = reply.userId;
        }
    }

    const replyDate = new Date(reply.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const isOwner = currentLoggedInUserId && replyOwnerId && currentLoggedInUserId === replyOwnerId.toString();

    let userLiked = false;
    let userDisliked = false;
    if (currentLoggedInUserId && reply.likes) {
        userLiked = reply.likes.some(l => l.userId === currentLoggedInUserId);
    }
    if (currentLoggedInUserId && reply.dislikes) {
        userDisliked = reply.dislikes.some(d => d.userId === currentLoggedInUserId);
    }
    
    const likeCount = reply.likes ? reply.likes.length : 0;
    const dislikeCount = reply.dislikes ? reply.dislikes.length : 0;
    
    let replyingToHtml = '';
    if (reply.replyingTo) {
        replyingToHtml = `<span class="replying-to-badge">@${escapeHtml(reply.replyingTo)}</span>`;
    }

    replyElement.innerHTML = `
        <div class="tree-reply-header">
            <img class="tree-reply-avatar" src="${authorAvatar}" alt="${escapeHtml(authorName)}">
            <div class="tree-reply-content">
                <div class="tree-reply-meta">
                    <span class="tree-reply-author">${escapeHtml(authorName)}</span>
                    <span class="tree-reply-date">${replyDate}</span>
                    ${isOwner ? `<button class="tree-reply-delete-btn" data-reply-id="${reply._id}">Delete</button>` : ''}
                </div>
                <div class="tree-reply-body">
                    ${replyingToHtml} ${escapeHtml(reply.reply)}
                </div>
                <div class="tree-reply-actions">
                    <button class="mini-interact-btn reply-like-btn ${userLiked ? 'active' : ''}" data-reply-id="${reply._id}">
                        <img src="/image/${userLiked ? 'like-icon-filled.png' : 'like-icon.png'}" alt="like">
                        <span class="count">${likeCount > 0 ? likeCount : ''}</span>
                    </button>
                    <button class="mini-interact-btn reply-dislike-btn ${userDisliked ? 'active' : ''}" data-reply-id="${reply._id}">
                        <img src="/image/${userDisliked ? 'dislike-filled.png' : 'dislike.png'}" alt="dislike">
                    </button>
                    <button class="mini-interact-btn reply-reply-btn" data-reply-id="${reply._id}">
                        <img src="/image/comment-icon.png" alt="reply">
                        <span>Reply</span>
                    </button>
                </div>
            </div>
        </div>
    `;

    if (targetReply) {
        if (targetReply.nextSibling) {
            repliesContainer.insertBefore(replyElement, targetReply.nextSibling);
        } else {
            repliesContainer.appendChild(replyElement);
        }
    } else if (isPrepended) {
        const topBtn = repliesContainer.querySelector('.replies-toggle');
        if (topBtn) {
            if (topBtn.nextSibling) {
                repliesContainer.insertBefore(replyElement, topBtn.nextSibling);
            } else {
                repliesContainer.appendChild(replyElement);
            }
        } else {
            repliesContainer.prepend(replyElement);
        }
    } else {
        const bottomBtn = repliesContainer.querySelector('.replies-toggle-bottom');
        if (bottomBtn) {
            repliesContainer.insertBefore(replyElement, bottomBtn);
        } else {
            repliesContainer.appendChild(replyElement);
        }
    }

    const deleteBtn = replyElement.querySelector('.tree-reply-delete-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async function (e) {
            e.preventDefault();
            const confirmed = await window.customConfirm('Delete Reply', 'Are you sure you want to delete this reply?');
            if (!confirmed) return;
            try {
                const response = await fetch(`/blogs/${blogSlug}/comment/${commentId}/reply/${reply._id}`, { method: 'DELETE', headers: { 'Accept': 'application/json' }});
                const data = await response.json();
                if (data.success) {
                    replyElement.remove();
                    if (typeof repliesContainer.removeReplyLive === 'function') {
                        repliesContainer.removeReplyLive(reply._id);
                    }
                }
            } catch (err) { console.error(err); }
        });
    }

    const likeBtn = replyElement.querySelector('.reply-like-btn');
    if (likeBtn) likeBtn.addEventListener('click', (e) => toggleReplyLike(e, blogSlug, commentId, reply._id));

    const dislikeBtn = replyElement.querySelector('.reply-dislike-btn');
    if (dislikeBtn) dislikeBtn.addEventListener('click', (e) => toggleReplyDislike(e, blogSlug, commentId, reply._id));

    const replyReplyBtn = replyElement.querySelector('.reply-reply-btn');
    if (replyReplyBtn) {
        replyReplyBtn.addEventListener('click', () => {
            if (!isUserLoggedIn()) {
                sessionStorage.setItem('authAction', 'reply');
                openAuthModal();
                return;
            }
            const replyContainer = document.querySelector(`#reply-container-${commentId}`);
            if (replyContainer) {
                const targetParent = replyElement.querySelector('.tree-reply-content');
                const isCurrentlyHere = replyContainer.parentNode === targetParent;
                const isHidden = replyContainer.classList.contains('hidden');
                
                if (isCurrentlyHere && !isHidden) {
                    replyContainer.classList.add('hidden');
                } else {
                    targetParent.appendChild(replyContainer);
                    replyContainer.classList.remove('hidden');
                    const submitBtn = replyContainer.querySelector('.reply-submit-btn');
                    submitBtn.setAttribute('data-replying-to', authorName);
                    
                    const input = replyContainer.querySelector('.reply-input');
                    input.placeholder = `Replying to @${authorName}...`;
                    input.focus();
                }
            }
        });
    }
}

async function toggleReplyLike(e, blogSlug, commentId, replyId) {
    if (!isUserLoggedIn()) {
        sessionStorage.setItem('authAction', 'like');
        openAuthModal();
        return;
    }
    const btn = e.currentTarget;
    try {
        const response = await fetch(`/blogs/${blogSlug}/comment/${commentId}/reply/${replyId}/like`, { method: 'POST', headers: { 'Accept': 'application/json' }});
        const data = await response.json();
        if (data.success) {
            const icon = btn.querySelector('img');
            const count = btn.querySelector('.count');
            if (data.liked) {
                btn.classList.add('active');
                icon.src = '/image/like-icon-filled.png';
            } else {
                btn.classList.remove('active');
                icon.src = '/image/like-icon.png';
            }
            if(count) count.textContent = data.likeCount > 0 ? data.likeCount : '';
            
            const dislikeBtn = document.querySelector(`.reply-dislike-btn[data-reply-id="${replyId}"]`);
            if (dislikeBtn && data.liked) {
                dislikeBtn.classList.remove('active');
                dislikeBtn.querySelector('img').src = '/image/dislike.png';
            }
        }
    } catch (err) { console.error('Error', err); }
}

async function toggleReplyDislike(e, blogSlug, commentId, replyId) {
    if (!isUserLoggedIn()) {
        sessionStorage.setItem('authAction', 'dislike');
        openAuthModal();
        return;
    }
    const btn = e.currentTarget;
    try {
        const response = await fetch(`/blogs/${blogSlug}/comment/${commentId}/reply/${replyId}/dislike`, { method: 'POST', headers: { 'Accept': 'application/json' }});
        const data = await response.json();
        if (data.success) {
            const icon = btn.querySelector('img');
            if (data.disliked) {
                btn.classList.add('active');
                icon.src = '/image/dislike-filled.png';
            } else {
                btn.classList.remove('active');
                icon.src = '/image/dislike.png';
            }
            
            const likeBtn = document.querySelector(`.reply-like-btn[data-reply-id="${replyId}"]`);
            if (likeBtn && data.disliked) {
                likeBtn.classList.remove('active');
                likeBtn.querySelector('img').src = '/image/like-icon.png';
                const likeCountSpan = likeBtn.querySelector('.count');
                if(likeCountSpan) likeCountSpan.textContent = data.likeCount > 0 ? data.likeCount : '';
            }
        }
    } catch (err) { console.error('Error', err); }
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function isUserLoggedIn() {
    return !!document.querySelector('.signedIn, [data-user-logged-in="true"]');
}

function openAuthModal() {
    const authModal = document.getElementById('authModal');
    if (authModal) {
        authModal.classList.remove('hidden');
        authModal.setAttribute('aria-hidden', 'false');
    }
}

function toggleCommentPanel() {
    const commentPanel = document.getElementById('commentPanel');
    if (commentPanel) {
        const isOpen = commentPanel.classList.contains('open');
        if (isOpen) {
            commentPanel.classList.remove('open');
        } else {
            commentPanel.classList.add('open');
            setTimeout(() => {
                const commentInput = commentPanel.querySelector('.comment-input');
                if (commentInput && isUserLoggedIn()) commentInput.focus();
            }, 100);
        }
    }
}
