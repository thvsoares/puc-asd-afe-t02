function Model() {
    self = this;

    var API_URL = 'https://api.shutterstock.com/v2';

    self.query = ko.observable();

    self.searchResult = ko.observableArray();

    self.currentResult = ko.observable(0);

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

    self.encodeAuthorization = function () {
        var clientId = '3352aeffbd24d33f8859';
        var clientSecret = '097f832242ad371d9f012770cabdb1e6cebc433a';
        return 'Basic ' + window.btoa(clientId + ':' + clientSecret);
    }

    self.search = function () {
        self.currentResult(0);
        self.searchResult.removeAll();

        var authorization = self.encodeAuthorization();

        $.ajax({
            url: API_URL + '/images/search',
            data: { query: self.query() },
            headers: {
                Authorization: authorization
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
                            imageSource: item.assets.large_thumb.url,
                            description: item.description
                        });
                    }
                });
            })
            .fail(function (xhr, status, err) {
                alert('Failed to retrieve ' + mediaType + ' search results:\n' + JSON.stringify(xhr.responseJSON, null, 2));
            });
    }
}

ko.applyBindings(new Model());