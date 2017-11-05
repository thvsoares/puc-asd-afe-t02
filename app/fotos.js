function Model() {
    self = this;

    var API_URL = 'https://api.shutterstock.com/v2';

    self.query = ko.observable();

    self.newAlbumName = ko.observable();

    self.searchResult = ko.observableArray();

    self.albuns = ko.observableArray();

    self.selectedAlbum = ko.observable();

    self.currentResult = ko.observable(0);

    self.slideShowIsVisible = ko.observable(false);

    self.thumbsIsVisible = ko.observable(false);

    self.albunsIsVisible = ko.observable(false);

    self.hideControls = function () {
        self.slideShowIsVisible(false);
        self.thumbsIsVisible(false);
        self.albunsIsVisible(false);
    }

    self.showSlidShow = function () {
        self.hideControls();
        self.slideShowIsVisible(true);
    }

    self.showThumbs = function () {
        self.hideControls();
        self.getAlbuns();
        self.thumbsIsVisible(true);
    }

    self.showAlbuns = function () {
        self.hideControls();
        self.getAlbuns();
        self.albunsIsVisible(true);
    }

    self.hasResults = ko.computed(function () {
        return self.searchResult().length;
    }, this);

    self.currentImageId = ko.computed(function () {
        if (!self.hasResults())
            return null;
        return self.searchResult()[self.currentResult()].id;
    }, this);

    self.currentImageSource = ko.computed(function () {
        if (!self.hasResults())
            return null;
        return self.searchResult()[self.currentResult()].imageSource;
    }, this);

    self.currentImageDescription = ko.computed(function () {
        if (!self.hasResults())
            return null;
        return self.searchResult()[self.currentResult()].description;
    }, this);

    self.previous = function () {
        if (!self.hasResults() || !self.currentResult())
            return;
        self.currentResult(self.currentResult() - 1);
    }

    self.next = function () {
        if (!self.hasResults() || self.currentResult() == self.searchResult().length)
            return;
        self.currentResult(self.currentResult() + 1);
    }

    //#region Authorization
    // Bearer authorization token
    self.token = ko.observable();

    // Code generated by the ShutterstockOAuth OAuth process
    self.code = ko.observable();

    // Return the authorization header
    self.authorization = function () {
        return 'Bearer ' + self.token();
    }

    // Indicate that the authorization processes was executed
    self.authorized = ko.pureComputed(function () {
        return self.token() != null;
    }, this)

    // Fires the authorization procudeure
    self.auth = function () {
        self.soauth.authorize();
    }

    self.soauth = new ShutterstockOAuth({
        client_id: "018cd-f1f3c-694b4-5785a-763bb-a0dd8",
        scope: "collections.view collections.edit",
        redirect_endpoint: "/completed.html",
        success: function (data) { self.callbackOauth("success", data); },
        failure: function (data) { self.callbackOauth("failure", data); },
        complete: function (data) { self.callbackOauth("complete", data); }
    });

    // Callback for the ShutterstockOAuth
    self.callbackOauth = function (status, data) {
        self.code(data.code);
        if (status == "success") {
            self.getToken();
        }
    }

    // Get the oauth access token
    self.getToken = function () {
        $.post({
            url: API_URL + '/oauth/access_token',
            data: {
                client_id: '018cd-f1f3c-694b4-5785a-763bb-a0dd8',
                client_secret: 'd5e98-ce967-bc914-4d546-1ce13-d6ccb',
                code: self.code(),
                grant_type: 'authorization_code'
            }
        }).done(function (data) {
            self.token(data.access_token);
        });
    }

    //#endregion

    self.search = function () {
        self.currentResult(0);
        self.searchResult.removeAll();
        self.showThumbs();

        $.ajax({
            url: API_URL + '/images/search',
            data: { query: self.query() },
            headers: {
                Authorization: self.authorization()
            }
        })
            .done(function (data) {
                if (data.total_count === 0) {
                    return;
                }
                $.each(data.data, function (i, item) {
                    if (item.media_type == 'image') {
                        self.searchResult.push({
                            id: item.id,
                            imageSource: item.assets.preview.url,
                            imageThumb: item.assets.large_thumb.url,
                            description: item.description,
                            selected: false
                        });
                    }
                });
            })
            .fail(function (xhr, status, err) {
                alert('Failed to retrieve ' + mediaType + ' search results:\n' + JSON.stringify(xhr.responseJSON, null, 2));
            });
    }

    self.setCurrentImage = function (image) {
        for (var index = 0; index < self.searchResult().length; index++) {
            if (self.searchResult()[index].id == image.id) {
                self.currentResult(index);
                break;
            }
        }

        self.showSlidShow();
    }

    self.getAlbuns = function () {
        self.albuns.removeAll();
        self.selectedAlbum(null);
        $.ajax({
            url: API_URL + '/images/collections',
            data: { query: self.query() },
            headers: {
                Authorization: self.authorization()
            }
        })
            .done(function (data) {
                if (data.total_count === 0) {
                    return;
                }
                $.each(data.data, function (i, item) {
                    self.albuns.push({
                        id: item.id,
                        name: item.name,
                        count: item.total_item_count
                    });
                });
            })
            .fail(function (xhr, status, err) {
                alert('Failed to retrieve search results:\n' + JSON.stringify(xhr.responseJSON, null, 2));
            });
    }

    self.createAlbun = function () {
        var data = ko.toJSON({ name: self.newAlbumName() });
        $.post({
            url: API_URL + '/images/collections',
            data: data,
            dataType: 'json',
            contentType: "application/json",
            headers: {
                Authorization: self.authorization()
            }
        })
            .done(function (data) {
                self.getAlbuns();
            })
            .fail(function (xhr, status, err) {
                alert('Failed to retrieve search results:\n' + JSON.stringify(xhr.responseJSON, null, 2));
            });
    }

    self.getAlbumImages = function (album) {
        self.searchResult.removeAll();
        self.currentResult(0);
        $.ajax({
            url: API_URL + '/images/collections/' + album.id + '/items',
            headers: {
                Authorization: self.authorization()
            }
        })
            .done(function (data) {
                if (data.data.lenght == 0) {
                    return;
                }
                $.each(data.data, function (i, item) {
                    self.getImage(item.id);
                });
                self.showThumbs();
            })
            .fail(function (xhr, status, err) {
                alert('Failed to retrieve search results:\n' + JSON.stringify(xhr.responseJSON, null, 2));
            });
    }

    self.getImage = function (id) {
        $.ajax({
            url: API_URL + '/images/' + id + '?view=minimal',
            headers: {
                Authorization: self.authorization()
            }
        })
            .done(function (data) {
                if (data && data.media_type == 'image') {
                    self.searchResult.push({
                        id: data.id,
                        imageSource: data.assets.preview.url,
                        imageThumb: data.assets.large_thumb.url,
                        description: data.description,
                        selected: false
                    });
                }
            });
    }

    self.addImages = function () {
        if (!self.selectedAlbum())
            return;
        var selectedItems = [];
        for (var i = 0; i < self.searchResult().length; i++) {
            if (self.searchResult()[i].selected) {
                selectedItems.push({
                    id: self.searchResult()[i].id,
                    media_type: 'image',
                    added_time: (new Date()).toJSON()
                });
            }
        }
        if (!selectedItems.length)
            return;
        var data = ko.toJSON({ items: selectedItems });
        $.post({
            url: API_URL + '/images/collections/' + self.selectedAlbum() + '/items',
            data: data,
            dataType: 'json',
            contentType: "application/json",
            headers: {
                Authorization: self.authorization()
            }
        })
            .done(function (data) {
                self.getAlbumImages({ id: self.selectedAlbum() });
            })
            .fail(function (xhr, status, err) {
                alert('Failed to retrieve search results:\n' + JSON.stringify(xhr.responseJSON, null, 2));
            });
    }
}

ko.applyBindings(new Model());