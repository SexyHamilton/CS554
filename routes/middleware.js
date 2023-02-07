const urlCount = {};
const logAll_MiddleWare = function (req, res, next) {
  console.log("requestbody:" + JSON.stringify(req.body, null, 4));
  const url = req.originalUrl;
  console.log("url path:" + url);
  if (urlCount[url] == undefined) {
    urlCount[url] = 1;
  } else {
    urlCount[url] = urlCount[url] + 1;
  }
  console.log("http Verb: " + req.method);
  console.log("url request sum: " + JSON.stringify(urlCount, null, 4));
  next();
};
