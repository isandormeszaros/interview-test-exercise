"use client"

import React, { useState, useEffect, ChangeEvent } from 'react';
import { useForm, Resolver, SubmitHandler } from "react-hook-form";

export type FormValues = {
    name: string;
    email: string;
    employees: number;
    description: string;
};

export type EmployeeFormValues = {
    [key: number]: {
        name: string;
        email: string;
        jobTitle: string;
        age: number;
        cv: File | null;
        pdfUrl?: string;
    };
};

const resolver: Resolver<FormValues> = async (values) => {
    const errors: Record<string, { type: string; message: string }> = {};

    if (!values.name) {
        errors.name = {
            type: "required",
            message: "Name is required!",
        };
    }

    if (!values.email) {
        errors.email = {
            type: "required",
            message: "Email is required!",
        };
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
        errors.email = {
            type: "required",
            message: "Invalid email format!",
        };
    }

    return {
        values,
        errors: Object.keys(errors).length > 0 ? errors : {},
    };
};




const CompanyForm: React.FC = () => {
    const [view, setView] = useState<'company' | 'employees'>('company');
    const [companyData, setCompanyData] = useState<FormValues | null>(null);
    const [employeeData, setEmployeeData] = useState<EmployeeFormValues>({});
    const [numEmployees, setNumEmployees] = useState<number>(1);
    const [employeeErrors, setEmployeeErrors] = useState<{ [key: string]: string }>({});


    const { register, handleSubmit, setValue: setFormValue, formState: { errors } } = useForm<FormValues>({ resolver });

    useEffect(() => {
        const getLocalData = () => {
            const storedCompanyData = localStorage.getItem('companyData');
            const storedEmployeeData = localStorage.getItem('employeeData');

            if (storedCompanyData && storedEmployeeData) {
                const parsedCompanyData = JSON.parse(storedCompanyData);
                const parsedEmployeeData = JSON.parse(storedEmployeeData);
                setCompanyData(parsedCompanyData);
                setEmployeeData(parsedEmployeeData);
                setNumEmployees(parsedCompanyData.employees);
                Object.keys(parsedCompanyData).forEach((key) => setFormValue(key as keyof FormValues, parsedCompanyData[key]));
            }
        };

        getLocalData();
    }, [setFormValue]);

    const onSubmit: SubmitHandler<FormValues> = (data) => {
        if (data.employees !== numEmployees && Object.keys(employeeData).length > 0) {
            const confirmChange = window.confirm("Changing the number of employees will remove existing employee data. Do you want to proceed?");
            if (!confirmChange) return;
            setEmployeeData({});
        }

        setCompanyData(data);
        localStorage.setItem('companyData', JSON.stringify(data));
        localStorage.setItem('employeeData', JSON.stringify(employeeData));
        setView('employees');

    };

    const handleBack = () => {
        setView('company');
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setNumEmployees(+e.target.value);
    };

    const handleEmployeeChange = (index: number, field: string, value: string | number | File) => {
        let updatedEmployee: { [key: string]: any } = {};
        let errorKey = `${field}-${index}`;

        switch (field) {
            case 'name':
                if (!value) {
                    updatedEmployee = { ...employeeErrors, [errorKey]: 'Name is required' };
                } else {
                    updatedEmployee = { ...employeeErrors };
                    delete updatedEmployee[errorKey];
                }
                break;

            case 'age':
                const ageValue = parseInt(value as string, 10);
                if (!value) {
                    updatedEmployee = { ...employeeErrors, [errorKey]: 'Age is required' };
                }
                else if (isNaN(ageValue) || ageValue <= 0 || ageValue < 18) {
                    updatedEmployee = { ...employeeErrors, [errorKey]: 'Age must be a positive number and at least 18' };
                } else {
                    updatedEmployee = { ...employeeErrors };
                    delete updatedEmployee[errorKey];
                }
                break;

            case 'email':
                const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!value) {
                    updatedEmployee = { ...employeeErrors, [errorKey]: 'Email is required' };
                } else if (!emailPattern.test(value as string)) {
                    updatedEmployee = { ...employeeErrors, [errorKey]: 'Invalid email format' };
                } else {
                    updatedEmployee = { ...employeeErrors };
                    delete updatedEmployee[errorKey];
                }
                break;

            case 'cv':
                const file = value as File;
                const reader = new FileReader();
                reader.onload = () => {
                    const blob = new Blob([reader.result as ArrayBuffer]);
                    const url = URL.createObjectURL(blob);
                    setEmployeeData(prev => ({
                        ...prev,
                        [index]: { ...prev[index], [field]: file, pdfUrl: url }
                    }));
                };
                reader.readAsArrayBuffer(file);
                break;

            default:
                break;
        }

        setEmployeeData(prev => ({ ...prev, [index]: { ...prev[index], [field]: value } }));
        setEmployeeErrors(updatedEmployee);
    };

    console.log(employeeData)


    const handleSaveEmployees = () => {
        localStorage.setItem('employeeData', JSON.stringify(employeeData));

     
        const handleSaveEmployees = () => {
            localStorage.setItem("employeeData", JSON.stringify(employeeData));
        
            const sendToBackend = async (data: FormValues, employeeData: EmployeeFormValues) => {
              const wrappedJson = {
                companyData: data,
                employeeData,
              };
        
              try {
                const response = await fetch("http://localhost:8080/api/saveData", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(wrappedJson),
                });
        
                if (!response.ok) {
                  throw new Error("Network response was not ok");
                }
        
                const responseData = await response.json();
                console.log("Data successfully sent to the backend", responseData);
              } catch (error) {
                console.error("Error sending data to the backend", error);
              }
            };
        
            if (companyData) {
              sendToBackend(companyData, employeeData);
            }
          };

    };

    console.log(companyData)

    return (
        <div className="container mx-auto bg-white">
            <div className="flex flex-col h-screen">
                <div className='p-4 text-white my-6 lg:p-0'>
                    <div className='text-3xl font-bold text-gray-800'>{view === 'company' ? '01' : '02'}</div>
                    <h1 className='text-xl text-start font-semibold text-gray-800'>Form Dashboard</h1>
                    <p className='text-sm text-gray-400 font-light'>Please fill this form correctly. The asterisk<sup>*</sup> symbol indicates that the field is required!</p>
                </div>

                <div className="flex">
                    <div className="w-1/4 bg-gray-200 bg-opacity-25 rounded-lg hidden lg:block">

                        <nav>
                            <ul>
                                <div className={`rounded-lg ${view === 'company' ? 'border border-secondary bg-gray-400 bg-opacity-25 ' : ''}`}>
                                    <div className="mr-4">
                                        <div className="flex rounded-lg p-2">
                                            <svg className='w-6 mr-1.5' width="20px" height="20px" strokeWidth="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="#af73ea"><path d="M12 11.5V16.5" stroke="#af73ea" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M12 7.51L12.01 7.49889" stroke="#af73ea" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#af73ea" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                                            <li className='text-gray-800 font-medium text-sm'>Company Data</li>
                                        </div>
                                    </div>
                                </div>
                                <div className={`flex p-2 ${view === 'employees' ? 'border border-secondary rounded-lg bg-gray-400 bg-opacity-25 ' : ''}`}>
                                    <svg className='w-6 mr-1.5' width="20px" height="20px" strokeWidth="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="#af73ea"><path d="M7 18V17C7 14.2386 9.23858 12 12 12V12C14.7614 12 17 14.2386 17 17V18" stroke="#af73ea" strokeWidth="1.5" strokeLinecap="round"></path><path d="M12 12C13.6569 12 15 10.6569 15 9C15 7.34315 13.6569 6 12 6C10.3431 6 9 7.34315 9 9C9 10.6569 10.3431 12 12 12Z" stroke="#af73ea" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><circle cx="12" cy="12" r="10" stroke="#af73ea" strokeWidth="1.5"></circle></svg>
                                    <li className='text-gray-800 font-medium text-sm'>Employee Data</li>
                                </div>
                            </ul>
                        </nav>
                    </div>

                    {view === 'company' && (
                        <div className="flex-1 p-4">
                            <h1 className='text-2xl text-start font-semibold text-gray-800'>My company</h1>
                            <p className='text-sm text-gray-400 mt-1'>This is basically a form field where you can enter your company details.</p>
                            <div className='border-b rounded-lg border-secondary mt-5'></div>

                            <div className="text-gray-700 mt-4">
                                <form onSubmit={handleSubmit(onSubmit)}>
                                    <div className="flex flex-col space-y-8">
                                        <div>
                                            <div className="flex justify-between">
                                                <h6 className='text-sm text-gray-800 mb-1 ml-1'>Name<sup>*</sup></h6>
                                                <p className='text-red-500 text-xs mb-2 ml-1 flex justify-end'>
                                                    {errors?.name && <span>{errors.name.message}</span>}
                                                </p>
                                            </div>
                                            <input type="text" id="name" placeholder='Cyber Shelby Corporations'
                                                className={`border border-secondary rounded-lg text-sm p-2 w-full focus:border-gray-400 focus:border-opacity-50 focus:outline-none ${errors.name?.type === "required" ? 'border-red-500 bg-red-50' : ''}`}
                                                required {...register("name", { required: true })} />
                                            <p className='text-gray-400 text-xs mt-2 ml-1'>This is your public display name. It can be your real name or a pseudonym.</p>
                                        </div>

                                        <div>
                                            <div className="flex justify-between">
                                                <h6 className='text-sm text-gray-800 mb-1 ml-1'>Email<sup>*</sup></h6>
                                                {errors.email && errors.email.type === "required" && (
                                                    <p className='text-red-500 text-xs mb-2 ml-1 flex justify-end'>
                                                        {errors?.email && <span>{errors.email.message}</span>}
                                                    </p>
                                                )}
                                            </div>
                                            <input type="email" id="email" placeholder='cybershelbycorp@company.com'
                                                className={`border border-secondary rounded-lg text-sm p-2 w-full focus:border-gray-400 focus:border-opacity-50 focus:outline-none ${errors.email?.type === "required" ? 'border-red-500 bg-red-50' : ''}`}
                                                required {...register("email", { required: true })} />
                                            <p className='text-gray-400 text-xs mt-2 ml-1'>Enter a valid email address</p>
                                        </div>

                                        <div>
                                            <div className="flex justify-between">
                                                <h6 className='text-sm text-gray-800 mb-1 ml-1'>Employees<sup>*</sup></h6>
                                                <p className='text-red-500 text-xs mb-2 ml-1 flex justify-end'>
                                                    {errors?.employees && <span>{errors.employees.message}</span>}
                                                </p>
                                            </div>
                                            <input type="number" id="employees" value={numEmployees}
                                                className={`border border-secondary rounded-lg text-sm p-2 w-full focus:border-gray-400 focus:border-opacity-50 focus:outline-none ${errors.employees?.type === "required" ? 'border-red-500 bg-red-50' : ''}`}
                                                required {...register("employees", { required: true })}
                                                onChange={handleChange} />
                                            <p className='text-gray-400 text-xs mt-2 ml-1'>Enter a number between 1 and 100</p>
                                        </div>

                                        <div>
                                            <div className="flex justify-between">
                                                <h6 className='text-sm text-gray-800 mb-1 ml-1'>Description</h6>
                                            </div>
                                            <textarea id="description" placeholder='We own a computer.'
                                                className="resize-none  border border-secondary rounded-lg text-sm p-2 w-full h-20 focus:border-gray-400 focus:border-opacity-50 focus:outline-none"
                                                {...register("description", { required: false })} />
                                            <p className='text-gray-400 text-xs mt-2 ml-1'>Provide a brief description of your company.</p>
                                        </div>
                                    </div>

                                    <div className="flex justify-end mt-8">
                                        <button type='submit' className="flex items-center rounded-md border border-secondary bg-transparent hover:bg-gray-300 hover:bg-opacity-25 pl-3.5 p-1.5 text-sm text-gray-800 bg-gray-300 bg-opacity-25">
                                            Next
                                            <svg className="w-6 mt-px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12px" height="12px" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
                                                <path d="M3 12L21 12M21 12L12.5 3.5M21 12L12.5 20.5" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                                            </svg>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {view === 'employees' && (
                        <div className="flex-1 p-4">
                            <h1 className='text-2xl text-start font-semibold text-gray-800'>Employee Data</h1>
                            <p className='text-sm text-gray-400 mt-1'>This is where you can enter your employee details.</p>
                            <div className='border-b rounded-lg border-secondary mt-5'></div>

                            <div className="text-gray-700 mt-4">
                                {Array.from({ length: numEmployees }, (_, index) => (
                                    <div key={index} className="mb-4 p-4 border rounded-lg">
                                        <h2 className="text-xl font-semibold mb-2">Employee {index + 1}</h2>
                                        <div className="flex flex-col space-y-4">
                                            <div>
                                                <div className="flex justify-between">
                                                    <h6 className={`employee-name-${index} block text-sm text-gray-800 mb-1 ml-1`}>Name<sup>*</sup></h6>
                                                    {employeeErrors[`name-${index}`] && (
                                                        <p className='text-red-500 text-xs mb-2 ml-1 flex justify-end'>
                                                            {employeeErrors[`name-${index}`]}
                                                        </p>
                                                    )}
                                                </div>
                                                <input
                                                    type="text"
                                                    id={`employee-name-${index}`}
                                                    className={`border border-secondary rounded-lg text-sm p-2 w-full focus:border-gray-400 focus:border-opacity-50 focus:outline-none ${employeeErrors[`name-${index}`] === "Name is required" ? 'border-red-500 bg-red-50' : ''}`}
                                                    value={employeeData[index]?.name || ''}
                                                    required
                                                    onChange={(e) => handleEmployeeChange(index, 'name', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <div className="flex justify-between">
                                                    <h6 className={`employee-email-${index} block text-sm text-gray-800 mb-1 ml-1`}>Email<sup>*</sup></h6>
                                                    {employeeErrors[`email-${index}`] && (
                                                        <p className='text-red-500 text-xs mb-2 ml-1 flex justify-end'>
                                                            {employeeErrors[`email-${index}`]}
                                                        </p>
                                                    )}
                                                </div>

                                                <input
                                                    type="email"
                                                    id={`employee-email-${index}`}
                                                    className={`border border-secondary rounded-lg text-sm p-2 w-full focus:border-gray-400 focus:border-opacity-50 focus:outline-none ${employeeErrors[`email-${index}`] === "Invalid email format" || employeeErrors[`email-${index}`] === "Email is required" ? 'border-red-500 bg-red-50' : ''}`}
                                                    value={employeeData[index]?.email || ''}
                                                    onChange={(e) => handleEmployeeChange(index, 'email', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor={`employee-job-title-${index}`} className="block text-sm text-gray-800 mb-1 ml-1">Job title<sup>*</sup></label>
                                                <select
                                                    id={`employee-job-title-${index}`}
                                                    className="mt-1 block w-full border text-sm text-gray-800 bg-gray-200 bg-opacity-25 border-secondary rounded-md p-2  focus:border-gray-400 focus:border-opacity-50 focus:outline-none"
                                                    value={employeeData[index]?.jobTitle || ''}
                                                    onChange={(e) => handleEmployeeChange(index, 'jobTitle', e.target.value)}
                                                >
                                                    <option value="accountant">Accountant</option>
                                                    <option value="software-developer">Software Developer</option>
                                                    <option value="software-tester">Software Tester</option>
                                                    <option value="manager">Manager</option>
                                                </select>
                                            </div>

                                            <div>
                                                <div className="flex justify-between">
                                                    <h6 className={`employee-age-${index} className="block text-sm text-gray-800 mb-1 ml-1`}>Age<sup>*</sup></h6>
                                                    {employeeErrors[`age-${index}`] && (
                                                        <p className='text-red-500 text-xs mb-2 ml-1 flex justify-end'>
                                                            {employeeErrors[`age-${index}`]}
                                                        </p>
                                                    )}
                                                </div>
                                                <input
                                                    type="number"
                                                    id={`employee-age-${index}`}
                                                    className={`border border-secondary rounded-lg text-sm p-2 w-full focus:border-gray-400 focus:border-opacity-50 focus:outline-none ${employeeErrors[`age-${index}`] === "Age must be a positive number and at least 18" || employeeErrors[`age-${index}`] === "Age is required" ? 'border-red-500 bg-red-50' : ''}`}
                                                    value={employeeData[index]?.age || ''}
                                                    onChange={(e) => handleEmployeeChange(index, 'age', e.target.value)}
                                                />
                                            </div>

                                            <div>
                                                <label htmlFor={`employee-cv-${index}`} className="block text-sm text-gray-800 mb-1 ml-1">CV Upload</label>
                                                <input
                                                    type="file"
                                                    accept="application/pdf"
                                                    id={`employee-cv-${index}`}
                                                    className="mt-1 block w-full border border-secondary rounded-md p-2  focus:border-gray-400 focus:border-opacity-50 focus:outline-none"
                                                    onChange={(e) => {
                                                        if (!e.target.files || e.target.files.length === null) {
                                                            console.error("Select a file");
                                                            return;
                                                        }
                                                        handleEmployeeChange(index, 'cv', e.target.files[0]);
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <div className="flex justify-between mt-4">
                                    <button onClick={handleBack} type='submit' className="flex items-center rounded-md border border-secondary bg-transparent hover:bg-gray-300 hover:bg-opacity-25 pr-3.5 p-1.5 text-sm text-gray-800 bg-gray-300 bg-opacity-25">
                                        <svg className="w-6 mt-px" width="12px" height="12px" viewBox="0 0 24 24" strokeWidth="1.5" fill="none" xmlns="http://www.w3.org/2000/svg" color="#000000">
                                            <path d="M21 12L3 12M3 12L11.5 3.5M3 12L11.5 20.5" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                                        </svg>
                                        Back
                                    </button>

                                    <button onClick={handleSaveEmployees} type='submit' className="flex items-center rounded-md border border-secondary bg-transparent hover:bg-gray-300 hover:bg-opacity-25 pl-3.5 p-1.5 text-sm text-gray-800 bg-gray-300 bg-opacity-25">
                                        Save
                                        <svg className="w-6 mt-px" width="12px" height="12px" strokeWidth="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="#000000"><path d="M6 20L18 20" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M12 16V4M12 4L15.5 7.5M12 4L8.5 7.5" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default CompanyForm;
