const bcrypt = require("bcrypt");
const db = require("../models");
const jwt = require("jsonwebtoken");

module.exports = {
  index: (req, res) => {
    db.User.find({}, (err, foundUsers) => {
      if (err) return console.error(err);
      res.json(foundUsers);
    });
  },
  signup: (req, res) => {
    console.log(req.body);

    db.User.find({ email: req.body.email })
      .exec()
      .then(user => {
        if (user.length >= 1) {
          return res.status(409).json({
            message: "email already exists"
          });
        } else {
          bcrypt.hash(req.body.password, 10, (err, hash) => {
            if (err) {
              console.log("hashing error:", err);
              res.status(200).json({ error: err });
            } else {
              db.User.create(
                {
                  email: req.body.email,
                  password: hash
                },
                (err, newUser) => {
                  console.log("here is the result", newUser);

                  let user = {
                    email: newUser.email,
                    _id: newUser._id
                  };

                  jwt.sign(
                    user,
                    "bWF0dGJyYW5kb25qb2VjaHJpc3RpbmE=",
                    {
                      expiresIn: "1h"
                    },
                    (err, signedJwt) => {
                      // send signed jwt
                      res.status(200).json({
                        message: "User Created",
                        user,
                        signedJwt
                      });
                    }
                  );
                }
              );
            }
          });
        }
      })
      .catch(err => {
        console.log(err);
        res.status(500).json({ err });
      });
  },
  login: (req, res) => {
    console.log("Login called");
    db.User.find({ email: req.body.email })
      .select("+password")
      .exec()
      .then(users => {
        if (users.length < 1) {
          return res.status(401).json({
            message: "Email or password is incorrect"
          });
        }

        bcrypt.compare(req.body.password, users[0].password, (err, match) => {
          if (err) {
            console.error(err);
            return status(500).json({ err });
          }

          if (match) {
            let user = {
              email: users[0].email,
              _id: users[0]._id
            };
            jwt.sign(
              user,
              "bWF0dGJyYW5kb25qb2VjaHJpc3RpbmE=",
              {
                expiresIn: "1h"
              },
              (err, signedJwt) => {
                res.status(200).json({
                  message: "Auth Successful",
                  user,
                  signedJwt
                });
              }
            );
          } else {
            res.status(401).json({ message: "Email or password is incorrect" });
          }
        });
      })
      .catch(err => {
        res.status(500).json({ err });
      });
  }
};
