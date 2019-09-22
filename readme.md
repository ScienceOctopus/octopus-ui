# Octopus UI

This is the new UI powering Octopus.

## Getting started

1. Clone this repository

```
git clone https://github.com/ScienceOctopus/octopus-ui.git
cd octopus-ui
```

2. Install dependencies

```
npm install
```

3. Create a `.env` file

4. Start the application

```
npm start
```


## .env file

The `.env` file is currently optional.

The API key and secret in the below example are the default key pair present
in sample data of API. This will change in production.

You can copy-paste the below example which will enable logging and
set some default values.

You'll need to create an ORCiD client and insert the ID and Secret here
in order to be able to log in via ORCiD.

```
# DEBUG variable is used to control logging levels
DEBUG=octopus:ui:* -octopus:ui:trace

# API Authentication
API_AUTH_KEY=1e062ebed67542af
API_AUTH_SECRET=YjNCbGJuTnphQzFyWlhrdGRqRUFBQUFB

# ORCiD client configuration
ORCID_CLIENT_ID=APP-XXXXXXXXXXXXXXXX
ORCID_CLIENT_SECRET=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

SESSION_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
DEBUG_MODE=false
```

## TODOs

- correctly log all errors
- add visual editor for publications
- add support for sorting and filtering results
- expand publishing process (file uploads, linked publications, collaborators)
- indicate publication status (DRAFT / ARCHIVE / LIVE)
- implement draft-to-publish process
- implement notifications
- add support for publication versioning
- display publication chain (linked publications)
- add more details on user profile page
- consistent colour scheme for buttons
- add cache layer
