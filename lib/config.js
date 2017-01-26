"use strict";
module.exports = {
  "type": "service",
  "prerequisites": {
    "cpu": " ",
    "memory": " "
  },
  "swagger": true,
  "dbs": [
    {
      "name": "mike",
      "model": "mongo",
      "multitenant": false
    }
  ],
  "serviceName": "pets",
  "serviceGroup": "animals",
  "serviceVersion": 1,
  "servicePort": 4101,
  "requestTimeout": 30,
  "requestTimeoutRenewal": 5,
  "extKeyRequired": false,
  "oauth": false,
  "session": false,
  "schema": {
    "post": {
      "/pets": {
        "_apiInfo": {
          "l": "Add a new pet to the store",
          "group": "pet"
        },
        "mw": __dirname + "/lib/mw/pets_post.js",
        "body": {
          "required": false,
          "source": [
            "body.body"
          ],
          "validation": {
            "type": "object",
            "required": [
              "name",
              "photoUrls"
            ],
            "properties": {
              "id": {
                "type": "integer",
                "format": "int64"
              },
              "category": {
                "type": "object",
                "properties": {
                  "id": {
                    "type": "integer",
                    "format": "int64"
                  },
                  "name": {
                    "type": "string"
                  }
                }
              },
              "name": {
                "type": "string",
                "example": "doggie"
              },
              "photoUrls": {
                "type": "array",
                "items": {
                  "type": "string"
                }
              },
              "tags": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "id": {
                      "type": "integer",
                      "format": "int64"
                    },
                    "name": {
                      "type": "string"
                    }
                  }
                }
              },
              "status": {
                "type": "string",
                "description": "pet status in the store"
              }
            }
          }
        }
      },
      "/pets/:petId": {
        "_apiInfo": {
          "l": "Updates a pet in the store with form data",
          "group": "pet"
        },
        "mw": __dirname + "/lib/mw/pets_petid_post.js",
        "petId": {
          "required": true,
          "source": [
            "params.petId"
          ],
          "validation": {
            "type": "string"
          }
        },
        "name": {
          "required": true,
          "source": [
            "body.name"
          ],
          "validation": {
            "type": "string"
          }
        },
        "status": {
          "required": true,
          "source": [
            "body.status"
          ],
          "validation": {
            "type": "string"
          }
        }
      },
      "/stores/order": {
        "_apiInfo": {
          "l": "Place an order for a pet",
          "group": "store"
        },
        "mw": __dirname + "/lib/mw/stores_order_post.js",
        "body": {
          "required": false,
          "source": [
            "body.body"
          ],
          "validation": {
            "type": "object",
            "properties": {
              "id": {
                "type": "integer",
                "format": "int64"
              },
              "petId": {
                "type": "integer",
                "format": "int64"
              },
              "quantity": {
                "type": "integer",
                "format": "int32"
              },
              "shipDate": {
                "type": "string",
                "format": "date-time"
              },
              "status": {
                "type": "string",
                "description": "Order Status"
              },
              "complete": {
                "type": "boolean"
              }
            }
          }
        }
      },
      "/users": {
        "_apiInfo": {
          "l": "Create user",
          "group": "user"
        },
        "mw": __dirname + "/lib/mw/users_post.js",
        "body": {
          "required": false,
          "source": [
            "body.body"
          ],
          "validation": {
            "type": "object",
            "properties": {
              "id": {
                "type": "integer",
                "format": "int64"
              },
              "username": {
                "type": "string"
              },
              "firstName": {
                "type": "string"
              },
              "lastName": {
                "type": "string"
              },
              "email": {
                "type": "string"
              },
              "password": {
                "type": "string"
              },
              "phone": {
                "type": "string"
              },
              "userStatus": {
                "type": "integer",
                "format": "int32",
                "description": "User Status"
              }
            }
          }
        }
      },
      "/users/createWithArray": {
        "_apiInfo": {
          "l": "Creates list of users with given input array",
          "group": "user"
        },
        "mw": __dirname + "/lib/mw/users_createwitharray_post.js",
        "body": {
          "required": false,
          "source": [
            "body.body"
          ],
          "validation": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": {
                  "type": "integer",
                  "format": "int64"
                },
                "username": {
                  "type": "string"
                },
                "firstName": {
                  "type": "string"
                },
                "lastName": {
                  "type": "string"
                },
                "email": {
                  "type": "string"
                },
                "password": {
                  "type": "string"
                },
                "phone": {
                  "type": "string"
                },
                "userStatus": {
                  "type": "integer",
                  "format": "int32",
                  "description": "User Status"
                }
              }
            }
          }
        }
      },
      "/users/createWithList": {
        "_apiInfo": {
          "l": "Creates list of users with given input array",
          "group": "user"
        },
        "mw": __dirname + "/lib/mw/users_createwithlist_post.js",
        "body": {
          "required": false,
          "source": [
            "body.body"
          ],
          "validation": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": {
                  "type": "integer",
                  "format": "int64"
                },
                "username": {
                  "type": "string"
                },
                "firstName": {
                  "type": "string"
                },
                "lastName": {
                  "type": "string"
                },
                "email": {
                  "type": "string"
                },
                "password": {
                  "type": "string"
                },
                "phone": {
                  "type": "string"
                },
                "userStatus": {
                  "type": "integer",
                  "format": "int32",
                  "description": "User Status"
                }
              }
            }
          }
        }
      }
    },
    "put": {
      "/pets": {
        "_apiInfo": {
          "l": "Update an existing pet",
          "group": "pet"
        },
        "mw": __dirname + "/lib/mw/pets_put.js",
        "body": {
          "required": false,
          "source": [
            "body.body"
          ],
          "validation": {
            "type": "object",
            "required": [
              "name",
              "photoUrls"
            ],
            "properties": {
              "id": {
                "type": "integer",
                "format": "int64"
              },
              "category": {
                "type": "object",
                "properties": {
                  "id": {
                    "type": "integer",
                    "format": "int64"
                  },
                  "name": {
                    "type": "string"
                  }
                }
              },
              "name": {
                "type": "string",
                "example": "doggie"
              },
              "photoUrls": {
                "type": "array",
                "items": {
                  "type": "string"
                }
              },
              "tags": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "id": {
                      "type": "integer",
                      "format": "int64"
                    },
                    "name": {
                      "type": "string"
                    }
                  }
                }
              },
              "status": {
                "type": "string",
                "description": "pet status in the store"
              }
            }
          }
        }
      },
      "/users/:username": {
        "_apiInfo": {
          "l": "Updated user",
          "group": "user"
        },
        "mw": __dirname + "/lib/mw/users_username_put.js",
        "username": {
          "required": true,
          "source": [
            "params.username"
          ],
          "validation": {
            "type": "string"
          }
        },
        "body": {
          "required": false,
          "source": [
            "body.body"
          ],
          "validation": {
            "type": "object",
            "properties": {
              "id": {
                "type": "integer",
                "format": "int64"
              },
              "username": {
                "type": "string"
              },
              "firstName": {
                "type": "string"
              },
              "lastName": {
                "type": "string"
              },
              "email": {
                "type": "string"
              },
              "password": {
                "type": "string"
              },
              "phone": {
                "type": "string"
              },
              "userStatus": {
                "type": "integer",
                "format": "int32",
                "description": "User Status"
              }
            }
          }
        }
      }
    },
    "get": {
      "/pets/findByStatus": {
        "_apiInfo": {
          "l": "Finds Pets by status",
          "group": "pet"
        },
        "mw": __dirname + "/lib/mw/pets_findbystatus_get.js",
        "status": {
          "required": false,
          "source": [
            "query.status"
          ],
          "validation": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        }
      },
      "/pets/findByTags": {
        "_apiInfo": {
          "l": "Finds Pets by tags",
          "group": "pet"
        },
        "mw": __dirname + "/lib/mw/pets_findbytags_get.js",
        "tags": {
          "required": false,
          "source": [
            "query.tags"
          ],
          "validation": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        }
      },
      "/pets/:petId": {
        "_apiInfo": {
          "l": "Find pet by ID",
          "group": "pet"
        },
        "mw": __dirname + "/lib/mw/pets_petid_get.js",
        "petId": {
          "required": true,
          "source": [
            "params.petId"
          ],
          "validation": {
            "type": "integer",
            "format": "int64"
          }
        }
      },
      "/stores/order/:orderId": {
        "_apiInfo": {
          "l": "Find purchase order by ID",
          "group": "store"
        },
        "mw": __dirname + "/lib/mw/stores_order_orderid_get.js",
        "orderId": {
          "required": true,
          "source": [
            "params.orderId"
          ],
          "validation": {
            "type": "string"
          }
        }
      },
      "/users/login": {
        "_apiInfo": {
          "l": "Logs user into the system",
          "group": "user"
        },
        "mw": __dirname + "/lib/mw/users_login_get.js",
        "username": {
          "required": false,
          "source": [
            "query.username"
          ],
          "validation": {
            "type": "string"
          }
        },
        "password": {
          "required": false,
          "source": [
            "query.password"
          ],
          "validation": {
            "type": "string"
          }
        }
      },
      "/users/logout": {
        "_apiInfo": {
          "l": "Logs out current logged in user session",
          "group": "user"
        },
        "mw": __dirname + "/lib/mw/users_logout_get.js"
      },
      "/users/:username": {
        "_apiInfo": {
          "l": "Get user by user name",
          "group": "user"
        },
        "mw": __dirname + "/lib/mw/users_username_get.js",
        "username": {
          "required": true,
          "source": [
            "params.username"
          ],
          "validation": {
            "type": "string"
          }
        }
      }
    },
    "delete": {
      "/pets/:petId": {
        "_apiInfo": {
          "l": "Deletes a pet",
          "group": "pet"
        },
        "mw": __dirname + "/lib/mw/pets_petid_delete.js",
        "api_key": {
          "required": true,
          "source": [
            "headers.api_key"
          ],
          "validation": {
            "type": "string"
          }
        },
        "petId": {
          "required": true,
          "source": [
            "params.petId"
          ],
          "validation": {
            "type": "integer",
            "format": "int64"
          }
        }
      },
      "/stores/order/:orderId": {
        "_apiInfo": {
          "l": "Delete purchase order by ID",
          "group": "store"
        },
        "mw": __dirname + "/lib/mw/stores_order_orderid_delete.js",
        "orderId": {
          "required": true,
          "source": [
            "params.orderId"
          ],
          "validation": {
            "type": "string"
          }
        }
      },
      "/users/:username": {
        "_apiInfo": {
          "l": "Delete user",
          "group": "user"
        },
        "mw": __dirname + "/lib/mw/users_username_delete.js",
        "username": {
          "required": true,
          "source": [
            "params.username"
          ],
          "validation": {
            "type": "string"
          }
        }
      }
    }
  },
  "errors": {
    "400": "Invalid username supplied",
    "404": "User not found",
    "405": "Invalid input"
  }
};