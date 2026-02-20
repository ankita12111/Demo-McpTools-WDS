CREATE TABLE branches (
    branch_id SERIAL PRIMARY KEY,
    branch_name TEXT,
    city TEXT,
    ifsc TEXT
);
select * from branches
 
CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    name TEXT,
    date_of_birth DATE,
    gender TEXT,
    email TEXT,
    phone TEXT,
    start_date DATE
);
 
CREATE TABLE accounts (
    account_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES customers(customer_id),
    branch_id INT NOT NULL REFERENCES branches(branch_id),
    account_type TEXT,
    balance NUMERIC NOT NULL,
    open_date DATE,
    status TEXT
);
 
CREATE TABLE loans (
    loan_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES customers(customer_id),
    account_id INT NOT NULL REFERENCES accounts(account_id),
    loan_type TEXT,
    principle NUMERIC,
    interest NUMERIC,
    term_months INT,
    status TEXT,
    start_date DATE,
    end_date DATE
);
 
CREATE TABLE transactions (
    transaction_id SERIAL PRIMARY KEY,
    account_id INT NOT NULL REFERENCES accounts(account_id),
    transaction_date DATE,
    transaction_type TEXT,
    amount NUMERIC,
    channel TEXT,
    status TEXT,
    start_date DATE,
    end_date DATE
);