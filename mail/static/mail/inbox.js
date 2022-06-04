document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').addEventListener('submit', send_email);
  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector("#email-view").style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector("#email-view").style.display = 'none';

  // Clear any information that was previously loaded in this view
  document.querySelector('#emails-view').innerHTML = '';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  
  fetch(`/emails/${ mailbox }`)
  .then(response => response.json())
  .then(emails => {    
      // ... do something else with emails ...
      let location = document.querySelector('#emails-view');

      for (let i = 0; i < emails.length; i++){
        let email = document.createElement('div');
        // email.id = emails[i].id;
        const read= emails[i].read;
        console.log(read);

        const sender = document.createElement('div');
        sender.innerHTML = emails[i].sender;
        // sender.setAttribute('align', 'left');
        sender.setAttribute('display', 'inline')

        const subject = document.createElement('div');
        
        if (emails[i].subject != '{}'){
          subject.innerHTML = emails[i].subject;
        }
        else{
          subject.innerHTML = "No Subject";
        }
        
        subject.setAttribute('display', 'inline');

        const timestamp = document.createElement('div');
        timestamp.innerHTML = emails[i].timestamp;
        timestamp.setAttribute('display', 'inline');
        
        email.appendChild(sender);
        email.appendChild(subject);
        email.appendChild(timestamp);
        email.style.border = 'solid black';

        if (read){
          email.style.backgroundColor = "rgb(200, 200, 200)";
        }
        else{
          email.style.backgroundColor = 'white';
          email.style.fontWeight = "bold";
        }

        email.addEventListener('click', () => open_email(emails[i].id, mailbox));
        location.append(email);
      }
  })
  .catch(error => {
    console.log(error)
  });
  
}

function send_email(event) {
  event.preventDefault();
  
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;
  
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then(result => {
      // Print result
      console.log(result);
  });

  load_mailbox('sent');
  return false;     
}

function open_email(id, mailbox) {
  fetch(`/emails/${ id }`, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  });

  fetch(`/emails/${ id }`)
  .then(response => response.json())
  .then(email => {
     
     const location = document.querySelector("#email-view");
     location.innerHTML = '';
     document.querySelector('#emails-view').style.display = 'none';
     document.querySelector('#compose-view').style.display = 'none';
     document.querySelector("#email-view").style.display = 'block';

     const from = document.createElement('div');
     const subject = document.createElement('div');
     const body = document.createElement('div');
     const archive_button = document.createElement('button');
     const reply_button = document.createElement('button');
     
     from.classList.add('email-item');
     subject.classList.add('email-item');
     body.classList.add('email-item');
     body.style.whiteSpace = 'pre-wrap';

     archive_button.classList.add('btn');
     archive_button.classList.add('btn-sm');
     archive_button.classList.add('btn-outline-primary');

     reply_button.classList.add('btn');
     reply_button.classList.add('btn-sm');
     reply_button.classList.add('btn-outline-primary');
    
     from.innerHTML = `From: ${ email.sender }`;

     location.appendChild(from);
     location.appendChild(subject);
     location.appendChild(body);
     location.appendChild(reply_button);

     if (mailbox != 'sent'){
       location.appendChild(archive_button);
     }
     
     const items = document.querySelectorAll('.email-item');
     
     items.forEach(item => {
       item.style.border = 'solid #c0c0c0';
       item.style.padding = '10px';
       item.style.margin = '10px';
       item.style.borderRadius = '5px';
     });

     const start = email.subject.slice(0, 3);
     if (email.subject != '{}') {
      if (start === "Re:") {
        subject.innerHTML = `${ email.subject }`;
       }
       else {
        subject.innerHTML = `Re: ${ email.subject }`;
       }
     }
     else {
        subject.innerHTML = "No Subject";
     }
     
     if (email.body != "{}"){
       body.innerHTML = email.body;
     }

     if (email.archived) {
       archive_button.innerHTML = 'Unarchive';
       archive_button.addEventListener('click', () => archive_email(email.id, false));
     }
     else {
       archive_button.innerHTML = 'Archive';
       archive_button.addEventListener('click', () => archive_email(email.id, true));
     }
     
     reply_button.innerHTML = 'Reply';
     reply_button.addEventListener('click', () => reply_email(email.sender, email.subject, email.body, email.timestamp));

  });
}

function archive_email(id, to_archive) {
  if (to_archive) {
    fetch(`/emails/${ id }`, {
      method: 'PUT',
      body: JSON.stringify({
          archived: true
      })
    })
    .then(() => load_mailbox('inbox'));
  }
  else {
    fetch(`/emails/${ id }`, {
      method: 'PUT',
      body: JSON.stringify({
          archived: false
      })
    })
    .then(() => load_mailbox('inbox'));
  }
}

function reply_email(sender, subject, body, time) {
  compose_email();
  const prefix = document.createElement('p');
  prefix.innerHTML = `On ${ time }, ${ sender } wrote:`;
  prefix.style.fontWeight = 'bold';

  document.querySelector('#compose-recipients').value = sender;
  const start = subject.slice(0, 3);
  
  if (start === "Re:") {
    document.querySelector('#compose-subject').value = `${ subject }`;
  }
  else {
    document.querySelector('#compose-subject').value = `Re: ${ subject }`;
  }
  
  document.querySelector('#compose-body').value = `${ prefix.innerHTML }\n${ body }`;
  // document.querySelector('#compose-body').style.fontWeight = 'bold';
}