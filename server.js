// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');

// const app = express();
// const port = process.env.PORT || 5000;

// app.use(cors());

// // Connect to MongoDB
// const dbURI = 'mongodb+srv://surabhkumar620540:int222@cluster0.451drus.mongodb.net/chatusers?retryWrites=true&w=majority'; 
// const contactSchema = new mongoose.Schema({
//     name: String,
//     number: String,
//   });
  
//   const Contact = mongoose.model('Contact', contactSchema);
// mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
//   .then(() => {
//     console.log('Connected to MongoDB');
//     app.listen(port, () => {
//       console.log(`Server running on port ${port}`);
//     });
//   })
//   .catch((err) => {
//     console.error('Error connecting to MongoDB:', err);
//   });

//   app.use(express.json());

//   // Create a new contact
//   app.post('/api/contacts', (req, res) => {
//     const newContact = new Contact(req.body);
//     newContact.save()
//       .then(() => {
//         res.status(201).json({ message: 'Contact created successfully' });
//       })
//       .catch((err) => {
//         console.error('Error creating contact:', err);
//         res.status(500).json({ message: 'Failed to create contact' });
//       });
//   });
  
//   // Get all contacts
//   app.get('/api/contacts', (req, res) => {
//     Contact.find()
//       .then((contacts) => {
//         res.json(contacts);
//       })
//       .catch((err) => {
//         console.error('Error getting contacts:', err);
//         res.status(500).json({ message: 'Failed to get contacts' });
//       });
//   });
  
//   // Update a contact
//   app.put('/api/contacts/:id', (req, res) => {
//     const { id } = req.params;
//     const { name, number } = req.body;
  
//     Contact.findByIdAndUpdate(id, { name, number })
//       .then(() => {
//         res.json({ message: 'Contact updated successfully' });
//       })
//       .catch((err) => {
//         console.error('Error updating contact:', err);
//         res.status(500).json({ message: 'Failed to update contact' });
//       });
//   });
  
//   // Delete a contact
//   app.delete('/api/contacts/:id', (req, res) => {
//     const { id } = req.params;
  
//     Contact.findByIdAndDelete(id)
//       .then(() => {
//         res.json({ message: 'Contact deleted successfully' });
//       })
//       .catch((err) => {
//         console.error('Error deleting contact:', err);
//         res.status(500).json({ message: 'Failed to delete contact' });
//       });
//   });
    

const express = require('express');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const io = require('socket.io')(8080, {
    cors: {
        origin: 'http://localhost:3002',
    }
});

// Connect DB
require('./db/connection');

// Import Files
const Users = require('./models/Users');
const Conversations = require('./models/Conversations');
const Messages = require('./models/Messages');

// app Use
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

const port = process.env.PORT || 8000;

// // Socket.io
// let users = [];
// io.on('connection', socket => {
//     console.log('User connected', socket.id);
//     socket.on('addUser', userId => {
//         const isUserExist = users.find(user => user.userId === userId);
//         if (!isUserExist) {
//             const user = { userId, socketId: socket.id };
//             users.push(user);
//             io.emit('getUsers', users);
//         }
//     });

//     socket.on('sendMessage', async ({ senderId, receiverId, message, conversationId }) => {
//         const receiver = users.find(user => user.userId === receiverId);
//         const sender = users.find(user => user.userId === senderId);
//         const user = await Users.findById(senderId);
//         console.log('sender :>> ', sender, receiver);
//         if (receiver) {
//             io.to(receiver.socketId).to(sender.socketId).emit('getMessage', {
//                 senderId,
//                 message,
//                 conversationId,
//                 receiverId,
//                 user: { id: user._id, fullName: user.fullName, email: user.email }
//             });
//             }else {
//                 io.to(sender.socketId).emit('getMessage', {
//                     senderId,
//                     message,
//                     conversationId,
//                     receiverId,
//                     user: { id: user._id, fullName: user.fullName, email: user.email }
//                 });
//             }
//         });

//     socket.on('disconnect', () => {
//         users = users.filter(user => user.socketId !== socket.id);
//         io.emit('getUsers', users);
//     });
//     // io.emit('getUsers', socket.userId);
// });

// Routes
app.get('/', (req, res) => {
    res.send('Welcome');
})

app.post('/api/register', async (req, res, next) => {
    try {
        const { fullName, email, password } = req.body;

        if (!fullName || !email || !password) {
            console.log('Error here')
            res.status(400).send('Please fill all required fields');
        } else {
            const isAlreadyExist = await Users.findOne({ email });
            if (isAlreadyExist) {
            console.log('Error heree')

                res.status(400).send('User already exists');
            } else {
                const newUser = new Users({ fullName, email });
                bcryptjs.hash(password, 10, (err, hashedPassword) => {
                    newUser.set('password', hashedPassword);
                    newUser.save();
                    next();
                })
                return res.status(200).send('User registered successfully');
            }
        }

    } catch (error) {
        console.log(error, 'Error')
    }
})

app.post('/api/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            console.log('Error0')
            res.status(400).send('Please fill all required fields');
        } else {
            const user = await Users.findOne({ email });
            if (!user) {
            console.log('Error1')

                res.status(400).send('User email or password is incorrect');
            } else {
                const validateUser = await bcryptjs.compare(password, user.password);
                if (!validateUser) {
            console.log('Error2')

                    res.status(400).send('User email or password is incorrect');
                } else {
                    const payload = {
                        userId: user._id,
                        email: user.email
                    }
                    const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || 'THIS_IS_A_JWT_SECRET_KEY';

                    jwt.sign(payload, JWT_SECRET_KEY, { expiresIn: 84600 }, async (err, token) => {
                        await Users.updateOne({ _id: user._id }, {
                            $set: { token }
                        })
                        user.save();
                        return res.status(200).json({ user: { id: user._id, email: user.email, fullName: user.fullName }, token: token })
                    })
                }
            }
        }

    } catch (error) {
        console.log(error, 'Error')
    }
})

app.post('/api/conversation', async (req, res) => {
    try {
        const { senderId, receiverId } = req.body;
        const newCoversation = new Conversations({ members: [senderId, receiverId] });
        await newCoversation.save();
        res.status(200).send('Conversation created successfully');
    } catch (error) {
        console.log(error, 'Error')
    }
})

app.get('/api/conversations/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const conversations = await Conversations.find({ members: { $in: [userId] } });
        const conversationUserData = Promise.all(conversations.map(async (conversation) => {
            const receiverId = conversation.members.find((member) => member !== userId);
            const user = await Users.findById(receiverId);
            return { user: { receiverId: user._id, email: user.email, fullName: user.fullName }, conversationId: conversation._id }
        }))
        res.status(200).json(await conversationUserData);
    } catch (error) {
        console.log(error, 'Error')
    }
})

app.post('/api/message', async (req, res) => {
    try {
        const { conversationId, senderId, message, receiverId = '' } = req.body;
        if (!senderId || !message) return res.status(400).send('Please fill all required fields')
        if (conversationId === 'new' && receiverId) {
            const newCoversation = new Conversations({ members: [senderId, receiverId] });
            await newCoversation.save();
            const newMessage = new Messages({ conversationId: newCoversation._id, senderId, message });
            await newMessage.save();
            return res.status(200).send('Message sent successfully');
        } else if (!conversationId && !receiverId) {
            return res.status(400).send('Please fill all required fields')
        }
        const newMessage = new Messages({ conversationId, senderId, message });
        await newMessage.save();
        res.status(200).send('Message sent successfully');
    } catch (error) {
        console.log(error, 'Error')
    }
})

app.get('/api/message/:conversationId', async (req, res) => {
    try {
        const checkMessages = async (conversationId) => {
            console.log(conversationId, 'conversationId')
            const messages = await Messages.find({ conversationId });
            const messageUserData = Promise.all(messages.map(async (message) => {
                const user = await Users.findById(message.senderId);
                return { user: { id: user._id, email: user.email, fullName: user.fullName }, message: message.message }
            }));
            res.status(200).json(await messageUserData);
        }
        const conversationId = req.params.conversationId;
        if (conversationId === 'new') {
            const checkConversation = await Conversations.find({ members: { $all: [req.query.senderId, req.query.receiverId] } });
            if (checkConversation.length > 0) {
                checkMessages(checkConversation[0]._id);
            } else {
                return res.status(200).json([])
            }
        } else {
            checkMessages(conversationId);
        }
    } catch (error) {
        console.log('Error', error)
    }
})

app.get('/api/users/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const users = await Users.find({ _id: { $ne: userId } });
        const usersData = Promise.all(users.map(async (user) => {
            return { user: { email: user.email, fullName: user.fullName, receiverId: user._id } }
        }))
        res.status(200).json(await usersData);
    } catch (error) {
        console.log('Error', error)
    }
})

app.listen(port, () => {
    console.log('listening on port ' + port);
})
  