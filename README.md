# Usage

Access the [API documentation](https://abbreviation.vialab.ca) for live testing the abbreviation methods.

## abbreviate method
Abbreviates a word into a desired number of characters.

### Sample call
Abbreviating a ```word``` "abbreviation" into 5 characters ```length```:
```
https://abbreviation.vialab.science.uoit.ca/abbreviate?word=abbreviation&length=5
```
Returns:
```
{
word: "abbreviation",
abbr: "abbrv",
length: 5
}
```

You can also abbreviate multiple words:
```
https://abbreviation.vialab.science.uoit.ca/abbreviate?word=abbreviation%20of%20multiple%20words&length=20
```
Returns:
```
{
word: "abbreviation of multiple words",
abbr: "abbri of mltpl words",
length: 20
}
```

## abbreviatelist method
This receives a batch of words and their respective desired lengths.
### Sample call
Abbreviates a given JSON object containing a list of words and their length.
```
https://abbreviation.vialab.science.uoit.ca/abbreviatelist
```
Sample object:
```
[{
  "word": "abbreviation",
  "length": 5
},
{
  "word": "abbreviation of multiple words",
  "length": 20
}]
```

Returns:
```
[{
  word: "abbreviation",
  abbr: "abbrv",
  length: 5
},
{
  word: "abbreviation of multiple words",
  abbr: "abbri of mltpl words",
  length: 20
}]
```


# Algorithm details
For details on how the algorithm decides on which letter to drop and keep, please refer to [project page](http://vialab.science.uoit.ca/portfolio/an-adaptive-crowdsourced-investigation-of-word-abbreviation-techniques-for-text-visualizations).

# Swagger generated server - technical details

## Overview
This server was generated by the [swagger-codegen](https://github.com/swagger-api/swagger-codegen) project.  By using the [OpenAPI-Spec](https://github.com/OAI/OpenAPI-Specification) from a remote server, you can easily generate a server stub.

### Running the server
To run the server, run:

```
npm start
```

To view the Swagger UI interface:

```
open http://localhost:10010/
```

This project leverages the mega-awesome [swagger-tools](https://github.com/apigee-127/swagger-tools) middleware which does most all the work.

### Modifying the controllers
The API supports two main functions; abbreviating a word, and abbreviating a list. The API entry point (controller) to the Abbreviation On Demand algorithm can be found at:

```
./api/swagger.yaml
./controllers/aod.js
```

In the controller NodeJS file (aod.js), the module exports are mappings between the /paths (swagger.yaml) and specific javascript functions that support input for processing output from the algorithm. As the algorithm is able to function as a stand alone library, wrapper functions within the NodeJS file have also been provided to exemplify how simply the Abbreviation On Demand algorithm can be integrated.

Abbreviation On Demand specific core functionality (modified for NodeJS support) can be found in:

```
./abbOnDemand.js
```
