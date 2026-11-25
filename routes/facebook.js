'use strict';
const express = require('express');
const { getPosts } = require('../lib/facebook');

module.exports = function facebookRoutes() {
  const router = express.Router();
  router.get('/', async (req, res) => {
    const data = await getPosts(6);
    res.set('Cache-Control', 'public, max-age=300').json(data);
  });
  return router;
};
