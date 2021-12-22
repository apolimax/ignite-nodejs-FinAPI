const express = require("express");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(express.json());

/**
 * cpf - string
 * name - strin
 * id - uuid
 * statement []
 *
 */

const customers = [];

// Middleware
function verifyIfAccountCPFExists(request, response, next) {
  const { cpf } = request.headers;

  const customer = customers.find((customer) => customer.cpf === cpf);

  if (!customer) {
    return response.status(400).json({ error: "Customer not found" });
  }

  request.customer = customer; // passando a variáivel customer através do request para as rotas que usam do middleware

  return next();
}

function getBalance(statement) {
  const balance = statement.reduce((acc, curr) => {
    if (curr.type === "credit") {
      return acc + curr.amount;
    } else if (curr.type === "debit") {
      return acc - curr.amount;
    }
  }, 0);

  return balance;
}

app.post("/account", (request, response) => {
  const { cpf, name } = request.body;

  const isCustomerAlreadyAClient = customers.some(
    (customer) => customer.cpf === cpf
  );

  if (isCustomerAlreadyAClient) {
    return response.status(400).json({ error: "Customer's already a client" });
  }

  customers.push({
    cpf,
    name,
    id: uuidv4(),
    statement: [],
  });

  return response.status(201).send();
});

// app.use(verifyIfAccountCPFExists);

app.get("/statement/", verifyIfAccountCPFExists, (request, response) => {
  const { customer } = request; // recuperando customer da request do middleware
  return response.json(customer.statement);
});

app.post("/deposit", verifyIfAccountCPFExists, (request, response) => {
  const { customer } = request; // recuperando customer da request do middleware
  const { description, amount } = request.body;

  const depositOperation = {
    description,
    amount,
    type: "credit",
    date: new Date(),
  };

  customer.statement.push(depositOperation);

  return response.status(201).send();
});

app.post("/withdraw", verifyIfAccountCPFExists, (request, response) => {
  const { amount } = request.body;
  const { customer } = request;
  const balance = getBalance(customer.statement);

  if (balance < amount) {
    return response.status(400).json({ message: "Insufficient funds" });
  }

  const depositOperation = {
    amount,
    type: "debit",
    date: new Date(),
  };

  customer.statement.push(depositOperation);

  return response
    .status(201)
    .json({ message: "Amount successfully withdrawn" });
});

app.get("/statement/date", verifyIfAccountCPFExists, (request, response) => {
  const { customer } = request; // recuperando customer da request do middleware
  const { date } = request.query;

  const dateFormat = new Date(date + " 00:00"); // "hackzinho" para obter qualquer horário do dia

  const statement = customer.statement.filter(
    (statement) =>
      statement.created_at.toDateString() === dateFormat.toDateString()
  );

  return response.json(statement);
});

app.put("/account", verifyIfAccountCPFExists, (request, response) => {
  const { name } = request.body;
  const { customer } = request;

  customer.name = name;

  return response.status(201).send();
});

app.get("/account", verifyIfAccountCPFExists, (request, response) => {
  const { customer } = request;

  return response.json(customer);
});

app.delete("/account", verifyIfAccountCPFExists, (request, response) => {
  const { customer: customerToDelete } = request;

  //   const newCustomers = customers.filter(
  //     (customer) => customer.cpf !== customerToDelete.cpf
  //   );

  // ou

  customers.splice(customerToDelete, 1);

  return response.status(200).json(customers);
});

app.get("/balance", verifyIfAccountCPFExists, (request, response) => {
  const { customer } = request;

  const balance = getBalance(customer.statement);

  return response.json(balance);
});

app.listen(3333);
