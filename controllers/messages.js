const Chat = require('../models/chat');
const User = require('../models/user');
const Product = require('../models/product');
const Deal = require('../models/deal');

module.exports = {
    // Chats Indexes
    async getChats(req, res) {
        // Show the chat only if the user takes part in it and
        // there have been messages sent already
        const chats = await Chat.paginate({$and:
             [{ $or: [{ "user1.id" : req.user._id }, { "user2.id": req.user._id}] },
                { "messageCount": { $gt: 0 } }] }, {
                    page: req.query.page || 1,
                    limit: 10,
                });
        chats.page = Number(chats.page);
        res.render('messages/messages', { chats, user: req.user });
    },
    // Get Messages
    async getMessages(req, res) {
        const chat = await Chat.findById( req.params.id );
        let userid = '';
        if ( chat.user1.id.toString() !== req.user._id.toString() ) {
            userid = chat.user1.id;
        } else {
            userid = chat.user2.id;
        }
        const user2 = await User.findById(userid);
        let buyer;
        if (chat.user1.id.toString() === req.user._id.toString()) {
            buyer = req.user;
        } else {
            buyer = user2;
        }
        const product = await Product.findById(chat.product.id);
        res.render('messages/messages_msg', { chat, user: req.user, user2, buyer, product });
    },
    // Update "read" field
    async updateMessages(req, res) {
        const chat = await Chat.findById( req.params.id );
        await chat.messages.forEach((message) => {
            if ( message.sender.toString() !== req.user._id.toString() ) {
                message.read = true;
            }
        });
        await chat.save();
        res.redirect(`/messages/${ req.params.id }`);
    },
    async updateMessagesDeal(req, res) {
        const chat = await Chat.findById( req.params.id );
        await chat.messages.forEach((message) => {
            if ( message.sender.toString() !== req.user._id.toString() ) {
                message.read = true;
            }
        });
        await chat.save();
        res.redirect(`/deals/${ req.params.dealid }`);
    },
    // Create Chat
    async newChat(req, res) {
        // Verify if this chat already exists
        const user = req.user;
        let chat = await Chat.findOne( { "user1.id": req.user._id, "product.id": req.params.id });
        if ( chat ) {
            res.redirect(`/messages/${chat._id}`);
        } else {
            // Find the product
            const product = await Product.findById( req.params.id );
            // Check if the user is the seller of the product
            if ( product.author.id.toString() === req.user._id.toString() ) {
                req.flash('error', 'You cannot start a chat with yourself.');
                res.redirect('back');
            } else if ( ((user.city == product.author.city) && (product.deliveryOptions.city.valid == true)) ||
                        ((user.state == product.author.state) && (product.deliveryOptions.state.valid == true)) ||
                        ((user.country == product.author.country) && (product.deliveryOptions.country.valid == true)) ||
                        (product.deliveryOptions.worldwide.valid == true) ) {
                // Find the seller
                const user2 = await User.findById( product.author.id );
                const newChat = {
                    user1: { id: req.user._id, fullname: req.user.full_name, avatarUrl: req.user.avatar.url },
                    user2: { id: user2.id, fullname: user2.full_name, avatarUrl: user2.avatar.url },
                    product: { id: product._id, name: product.name, imageUrl: product.images[0].url, price: product.price,
                    accepted: product.accepted }
                };
                chat = await Chat.create(newChat);
                res.redirect(`/messages/${chat._id}`);
            } else {
                req.flash('error', 'The seller does not deliver in your area.');
                res.redirect('back');
            }
        }        
    },
    // Create Chat - Ongoing deal with no chat
    async newOngoingChat(req, res) {
        // Verify if this chat already exists
        let chat = await Chat.find({ "user1.id": req.user._id, "product.id": req.params.id });
        if ( chat._id ) {
            // Link the chat to the deal
            let deal = await Deal.findById(req.params.dealid);
            deal.chat = chat._id;
            chat.deal = req.params.dealid;
            await deal.save();
            await chat.save();
            req.flash('success', 'You have successfully sent a purchase request.');
            res.redirect(`/deals/${deal._id}`);
        } else {
            // Find the product
            const product = await Product.findById( req.params.id );
            // Find the seller
            const user2 = await User.findById( product.author.id );
            const newChat = {
                user1: { id: req.user._id, fullname: req.user.full_name, avatarUrl: req.user.avatar.url },
                user2: { id: user2.id, fullname: user2.full_name, avatarUrl: user2.avatar.url },
                product: { id: product._id, name: product.name, imageUrl: product.images[0].url, price: product.price,
                    accepted: product.accepted },
                    deal: req.params.dealid 
                };
            chat = await Chat.create(newChat);
            // Link the chat to the deal
            let deal = await Deal.findById(req.params.dealid);
            deal.chat = chat._id;
            await deal.save();
            req.flash('success', 'You have successfully sent a purchase request.');
            res.redirect(`/deals/${deal._id}`);
        }
    },
    // Create Message
    async newMessage(req, res) {
        // Find the chat
        const chat = await Chat.findById( req.params.id );
        // Create the new message
        const newMessage = {
            sender: req.user._id,
            message: req.body.message,
        }
        // Insert the message
        chat.messages.push(newMessage);
        chat.messageCount += 1;
        await chat.save();
        res.redirect(`/messages/${chat._id}`);
    },
    async newMessageDeal(req, res) {
        // Find the chat
        const chat = await Chat.findById( req.params.id );
        // Create the new message
        const newMessage = {
            sender: req.user._id,
            message: req.body.message,
        }
        // Insert the message
        chat.messages.push(newMessage);
        chat.messageCount += 1;
        await chat.save();
        res.redirect(`/deals/${req.params.dealid}`);
    },    
};