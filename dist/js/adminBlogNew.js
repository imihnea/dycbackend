function PicturePreview(input, boxNr) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();
  
        switch(boxNr) {
          case 0:
            reader.onload = function (e) {
              $('#Preview0')
                  .attr('src', e.target.result);
            };
            break;
          case 1:
              reader.onload = function (e) {
                $('#Preview1')
                    .attr('src', e.target.result);
            };
            break;
          case 2:
              reader.onload = function (e) {
                $('#Preview2')
                    .attr('src', e.target.result);
            };
            break;
          case 3:
              reader.onload = function (e) {
                $('#Preview3')
                    .attr('src', e.target.result);
            };
            break;
          case 4:
              reader.onload = function (e) {
                $('#Preview4')
                    .attr('src', e.target.result);
            };
            break;
  
        }
  
        reader.readAsDataURL(input.files[0]);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const tagInput = document.getElementById('tagInput');
    let tags = document.getElementById('tags');
    const tagsControl = document.getElementById('tagsControl');
    let deleteTagBtns = document.querySelectorAll('.deleteTag');
    let deleteTagItems = [].slice.call(deleteTagBtns);
    const addButton = document.getElementById('addTag');
    let times = tagsControl.children.length;
    const KEY_ENTER = 13;
    tagInput.addEventListener('keydown', (e) => {
      let key = e.charCode || e.keyCode || e.which;
      if ((key == KEY_ENTER) && (tagInput.value.length > 1) && (times < 10)) {
        e.preventDefault();
        times += 1;
        if (times == 10) {
          tagInput.placeholder = 'You have reached the tag limit';
          tagInput.disabled = true;
          tagInput.classList.add('parsley-error');
        }
        // Add the tag to tag input that gets sent
        tags.value += ' ' + String(tagInput.value);
        // Create the tag element
        tagsControl.innerHTML += `<span class="tag is-link is-medium">${String(tagInput.value)}<button type="button" class="delete deleteTag is-small"></button></span>`;
        // Clean the input
        tagInput.value = '';
        // Remake the array of delete buttons with the new tag
        deleteTagBtns = document.querySelectorAll('.deleteTag');
        deleteTagItems = [].slice.call(deleteTagBtns);
        // Create the tag deletion event
        deleteTagItems.forEach((item) => {
          item.addEventListener('click', () => {
            const text = item.parentElement.innerText;
            const regex = new RegExp('\\b' + text + '\\b');
            // Remove the tag
            tags.value = tags.value.replace(regex, '');
            // Remove extra spaces
            tags.value = tags.value.replace(/\s+/g, ' ').trim();
            item.parentElement.remove();
            times -= 1;
            if (tagInput.classList.contains('parsley-error')) {
              tagInput.classList.remove('parsley-error');
              tagInput.disabled = false;
              tagInput.placeholder = 'Tags';
            }
          });
        });
      }
    });
    
    addButton.addEventListener('click', () => {
      if ((tagInput.value.length > 1) && (times < 10)) {
        times += 1;
        if (times == 10) {
            tagInput.placeholder = 'You have reached the tag limit';
            tagInput.disabled = true;
            tagInput.classList.add('parsley-error');
        }
        // Add the tag to tag input that gets sent
        tags.value += ' ' + String(tagInput.value);
        // Create the tag element
        tagsControl.innerHTML += `<span class="tag is-link is-medium">${String(tagInput.value)}<button type="button" class="delete deleteTag is-small"></button></span>`;
        // Clean the input
        tagInput.value = '';
        // Remake the array of delete buttons with the new tag
        deleteTagBtns = document.querySelectorAll('.deleteTag');
        deleteTagItems = [].slice.call(deleteTagBtns);
        // Create the tag deletion event
        deleteTagItems.forEach((item) => {
          item.addEventListener('click', () => {
            const text = item.parentElement.innerText;
            const regex = new RegExp('\\b' + text + '\\b');
            // Remove the tag
            tags.value = tags.value.replace(regex, '');
            // Remove extra spaces
            tags.value = tags.value.replace(/\s+/g, ' ').trim();
            item.parentElement.remove();
            times -= 1;
            if (tagInput.classList.contains('parsley-error')) {
              tagInput.classList.remove('parsley-error');
              tagInput.disabled = false;
              tagInput.placeholder = 'Tags';
            }
          });
        });
        tagInput.focus(); 
        }
    });
});