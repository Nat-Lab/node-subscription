var Nedb = require('nedb');

var NodeSubscription = function ({userdb, projectdb}) {
	var db = {
		u: new Nedb(userdb),
		p: new Nedb(projectdb)
	};
	[db.u, db.p].forEach(d => d.loadDatabase());

  var User = function (uid, options) {

		var project = {
			new: function ({name, catalog, public}) {
				var _pub = public || false;
				return new Promise((resolve, reject) => {
					db.p.find({name, catalog}, (err, val) => {
						if(err) reject(err);
						else {
							db.p.insert({name, catalog, admins: [uid], public: _pub});
							resolve(true);
						}
					})
				});
			},
			list: function () {
				return new Promise((resolve, reject) => {
					db.p.find({admins: uid}, (err, val) => {
						if(err) reject(err);
						else resolve(val);
					})
				});
			},
			set: function (pid) {
				return (function () {
					var obj = {};
					['name', 'catalog', 'content', 'public'].forEach(i => {
						obj[i] = function (val) {
							return new Promise((resolve, reject) => {
								var edit = {};
								edit[i] = val;
								db.p.update({_id: pid, admins: uid}, {
									$set: edit
								}, {}, err => {
									if (err) reject(err);
									else resolve(true);
								});
							});
						}
					});
					obj.admin = {
						add: function(_uid) {
							return new Promise((resolve, reject) => {
								db.p.update({_id: pid, admins: uid}, { $push: { admins: _uid } }, {}, err => {
									if(err) reject(err);
									else resolve(true);
								});
							});
						},
						remove: function(_uid) {
							return new Promise((resolve, reject) => {
								if (_uid === uid) {
									reject("You can't remove yourself.");
									return false;
								}
								db.p.update({_id: pid, admins: uid}, { $pull: { admins: uid } }, {}, err => {
									if(err) reject(err);
									else resolve(true);
								});
							});
						}
					}
					return obj;
				})();
			},
			remove: function (pid) {
				return new Promise((resolve, reject) => {
					db.p.remove({_id: pid, admins: uid}, {}, err => {
						if(err) reject(err);
						else resolve(true);
					});
				});
			}
		},
		subscription = {
			find: function ({name, catalog}) {
				var q = {};
				q.public = true;
				if(name) q.name = name;
				if(catalog) q.catalog = catalog;
				return new Promise((resolve, reject) => {
					db.p.find(q, (err, val) => {
						if(err) reject(err);
						else resolve(val);
					});
				});
			},
			subscribe: function (pid) {
				return new Promise((resolve, reject) => {
					db.u.find({uid}, (err, val) => {
						if(err) reject(err);
						else {
							if (val.length == 0) {
								var _opt = options || {};
								db.u.insert({uid, subscriptions: [pid], options: _opt});
							} else db.u.update({uid}, { $push: { subscriptions: pid } }, {}, err => {
								if(err) reject(err);
								else resolve(true);
							});
						}
					});
				});
			},
			unsubscribe: function (pid) {
				return new Promise((resolve, reject) => {
					db.u.update({uid}, { $pull: { subscriptions: pid } }, {}, err => {
						if(err) reject(err);
						else resolve(true);
					});
				});
			},
			list_subscribed () {
				return new Promise((resolve, reject) => {
					db.u.find({uid}, (err, val) => {
						if(err) reject(err);
						else resolve(val[0]);
					})
				});
			},
			get () {
				return new Promise((resolve, reject) => {
					db.u.find({uid}, (err, val) => {
						if(err || val.length === 0) reject(err || 'No subscribed channel found.');
						var qt = [], res = [];
						val[0].subscriptions.forEach(p => {
							var q = {};
							q._id = p;
							qt.push(q);
						});
						db.p.find({$or: qt}, (err, val) => {
							if(err) reject(err);
							resolve (val);
						});
					})
				});
			}
		},
		setting = {
			get: function() {
				return new Promise((resolve, reject) => {
					db.u.find({uid}, (err, val) => {
						if(err) reject(err);
						if(val.length === 0) resolve({});
						else resolve(val[0].options);
					});
				});
			},
			set: function (options) {
				return new Promise((resolve, reject) => {
					db.u.find({uid}, (err, val) => {
						if(err) reject(err);
						else {
							if (val.length == 0) {
								var _opt = options || {};
								db.u.insert({uid, subscriptions: [], options: _opt});
							} else db.u.update({uid}, { $set: { options: _opt } }, {}, err => {
								if(err) reject(err);
								else resolve(true);
							});
						}
					});
				});
			}
		};

		return {
			project, subscription, setting
		};
	},
	inspector = {
		subscriber: {
			list: function () {
				return new Promise((resolve, reject) => {
					db.u.find({}, (err, val) => {
						if(err) reject(err);
						else resolve(val);
					})
				});
			},
			edit: function(uid) {
				return (function () {
					var obj = {};
					['uid', 'subscriptions', 'options'].forEach(i => {
						obj[i] = function (val) {
							return new Promise((resolve, reject) => {
								var edit = {};
								edit[i] = val;
								db.u.update({uid}, {
									$set: edit
								}, {}, err => {
									if (err) reject(err);
									else resolve(true);
								});
							});
						}
					});
					return obj;
				})();
			}
		},
		project: {
			list: function () {
				return new Promise((resolve, reject) => {
					db.p.find({}, (err, val) => {
						if(err) reject(err);
						else resolve(val);
					})
				});
			},
			edit: function (pid) {
				return (function () {
					var obj = {};
					['name', 'catalog', 'content', 'public'].forEach(i => {
						obj[i] = function (val) {
							return new Promise((resolve, reject) => {
								var edit = {};
								edit[i] = val;
								db.p.update({_id: pid}, {
									$set: edit
								}, {}, err => {
									if (err) reject(err);
									else resolve(true);
								});
							});
						}
					});
					return obj;
				})();
			}
		}
	};

	return {
		User,
		inspector
	};
}

module.exports = NodeSubscription;
