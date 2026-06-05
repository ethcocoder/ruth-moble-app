import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import {
  Employee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  listenToEmployees,
  listenToTotalEmployeesCount,
  listenToActiveEmployeesCount,
} from '@/lib/_core/firestore';
import { HapticButton } from '@/components/haptic-button';
import { format } from 'date-fns';
import { useAuthContext } from '@/lib/auth-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useNetworkValidation } from '@/lib/use-network-validation';

export default function AdminEmployeesScreen() {
  const { userRole, userStatus, loading: authLoading } = useAuthContext();
  const router = useRouter();
  const { t } = useTranslation();
  const { validateNetwork } = useNetworkValidation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    role: '',
    salary: '',
    phone: '',
    department: '',
    status: 'active' as const,
    joinedDate: format(new Date(), 'yyyy-MM-dd'),
  });
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [activeEmployees, setActiveEmployees] = useState(0);

  useEffect(() => {
    if (authLoading) return;

    if (userStatus === 'pending') {
      router.replace('/auth/pending');
      return;
    }

    if (userRole !== 'admin' || userStatus !== 'approved') {
      router.replace(userRole === 'staff' ? '/staff-dashboard' : '/auth/login');
      return;
    }

    // Set up real-time listeners
    const unsubscribeEmployees = listenToEmployees((data) => {
      setEmployees(data);
      setLoading(false);
    });

    const unsubscribeTotal = listenToTotalEmployeesCount((count) => {
      setTotalEmployees(count);
    });

    const unsubscribeActive = listenToActiveEmployeesCount((count) => {
      setActiveEmployees(count);
    });

    // Cleanup listeners on unmount
    return () => {
      unsubscribeEmployees();
      unsubscribeTotal();
      unsubscribeActive();
    };
  }, [authLoading, router, userRole, userStatus]);

  const handleAddEmployee = async () => {
    // Validate network before operation
    const isOnline = await validateNetwork('Add Employee');
    if (!isOnline) return;

    try {
      if (!newEmployee.name || !newEmployee.email || !newEmployee.role || !newEmployee.salary) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }
      await createEmployee({
        ...newEmployee,
        salary: Number(newEmployee.salary),
      });
      setNewEmployee({
        name: '',
        email: '',
        role: '',
        salary: '',
        phone: '',
        department: '',
        status: 'active',
        joinedDate: format(new Date(), 'yyyy-MM-dd'),
      });
      setShowAddModal(false);
    } catch (error) {
      console.error('Failed to add employee:', error);
    }
  };

  const handleToggleStatus = async (employee: Employee) => {
    // Validate network before operation
    const isOnline = await validateNetwork('Update Employee Status');
    if (!isOnline) return;

    const newStatus = employee.status === 'active' ? 'inactive' : 'active';
    try {
      await updateEmployee(employee.id, { status: newStatus });
    } catch (error) {
      console.error('Failed to update employee:', error);
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    Alert.alert(
      'Delete Employee',
      'Are you sure you want to delete this employee?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // Validate network before operation
            const isOnline = await validateNetwork('Delete Employee');
            if (!isOnline) return;

            try {
              await deleteEmployee(employeeId);
            } catch (error) {
              console.error('Failed to delete employee:', error);
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  if (loading) {
    return (
      <ScreenContainer className="bg-background">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0a7ea4" />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="bg-background">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-6 py-6 gap-2 bg-primary/10">
          <Text className="text-2xl font-bold text-foreground">Employee Management</Text>
        </View>

        <View className="px-6 py-4 gap-4">
          {/* KPIs */}
          <FlatList
            data={[
              { label: 'Total Employees', value: `${totalEmployees}` },
              { label: 'Active Employees', value: `${activeEmployees}` },
            ]}
            keyExtractor={(item) => item.label}
            scrollEnabled={false}
            numColumns={2}
            columnWrapperStyle={{ gap: 12 }}
            renderItem={({ item }) => (
              <View className="flex-1 bg-surface rounded-lg p-4 items-center gap-2">
                <Text className="text-muted text-xs text-center">{item.label}</Text>
                <Text className="text-foreground font-bold text-lg">{item.value}</Text>
              </View>
            )}
          />

          {/* Add Button */}
          <TouchableOpacity
            onPress={() => setShowAddModal(true)}
            className="bg-primary rounded-lg py-3 items-center"
          >
            <Text className="text-background font-semibold">Add Employee</Text>
          </TouchableOpacity>

          {/* Add Modal */}
          {showAddModal && (
            <View className="bg-surface rounded-lg p-4 gap-3">
              <Text className="text-foreground text-lg font-semibold">Add Employee</Text>
              <TextInput
                className="bg-background border border-border rounded-lg p-3 text-foreground"
                placeholder="Name"
                placeholderTextColor="#9ca3af"
                value={newEmployee.name}
                onChangeText={(text) => setNewEmployee({ ...newEmployee, name: text })}
              />
              <TextInput
                className="bg-background border border-border rounded-lg p-3 text-foreground"
                placeholder="Email"
                placeholderTextColor="#9ca3af"
                value={newEmployee.email}
                onChangeText={(text) => setNewEmployee({ ...newEmployee, email: text })}
              />
              <TextInput
                className="bg-background border border-border rounded-lg p-3 text-foreground"
                placeholder="Role"
                placeholderTextColor="#9ca3af"
                value={newEmployee.role}
                onChangeText={(text) => setNewEmployee({ ...newEmployee, role: text })}
              />
              <TextInput
                className="bg-background border border-border rounded-lg p-3 text-foreground"
                placeholder="Salary"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
                value={newEmployee.salary}
                onChangeText={(text) => setNewEmployee({ ...newEmployee, salary: text })}
              />
              <TextInput
                className="bg-background border border-border rounded-lg p-3 text-foreground"
                placeholder="Phone"
                placeholderTextColor="#9ca3af"
                value={newEmployee.phone}
                onChangeText={(text) => setNewEmployee({ ...newEmployee, phone: text })}
              />
              <TextInput
                className="bg-background border border-border rounded-lg p-3 text-foreground"
                placeholder="Department"
                placeholderTextColor="#9ca3af"
                value={newEmployee.department}
                onChangeText={(text) => setNewEmployee({ ...newEmployee, department: text })}
              />
              <View className="flex-row gap-3">
                <TouchableOpacity
                  className="flex-1 bg-surface border border-border rounded-lg py-3 items-center"
                  onPress={() => setShowAddModal(false)}
                >
                  <Text className="text-foreground font-semibold">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 bg-primary rounded-lg py-3 items-center"
                  onPress={handleAddEmployee}
                >
                  <Text className="text-background font-semibold">Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Employees Table */}
          {employees.length === 0 ? (
            <View className="items-center py-10">
              <Text className="text-muted">No employees yet.</Text>
            </View>
          ) : (
            <View className="bg-surface rounded-lg overflow-hidden">
              {/* Table Container - Horizontally Scrollable */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={true}
                className="w-full"
              >
                <View className="min-w-[800px]">
                  {/* Table Header */}
                  <View className="bg-primary/20 flex-row border-b border-border">
                    <View className="w-[120px] p-3">
                      <Text className="text-foreground font-bold text-sm">Name</Text>
                    </View>
                    <View className="w-[180px] p-3">
                      <Text className="text-foreground font-bold text-sm">Email</Text>
                    </View>
                    <View className="w-[100px] p-3">
                      <Text className="text-foreground font-bold text-sm">Role</Text>
                    </View>
                    <View className="w-[100px] p-3">
                      <Text className="text-foreground font-bold text-sm">Department</Text>
                    </View>
                    <View className="w-[100px] p-3">
                      <Text className="text-foreground font-bold text-sm">Phone</Text>
                    </View>
                    <View className="w-[100px] p-3">
                      <Text className="text-foreground font-bold text-sm">Salary</Text>
                    </View>
                    <View className="w-[100px] p-3">
                      <Text className="text-foreground font-bold text-sm">Status</Text>
                    </View>
                    <View className="w-[100px] p-3">
                      <Text className="text-foreground font-bold text-sm">Joined</Text>
                    </View>
                    <View className="w-[200px] p-3">
                      <Text className="text-foreground font-bold text-sm">Actions</Text>
                    </View>
                  </View>

                  {/* Table Rows */}
                  {employees.map((employee, index) => (
                    <View
                      key={employee.id}
                      className={`flex-row border-b border-border ${
                        index % 2 === 0 ? 'bg-surface' : 'bg-background'
                      }`}
                    >
                      <View className="w-[120px] p-3 justify-center">
                        <Text className="text-foreground font-medium text-sm">
                          {employee.name}
                        </Text>
                      </View>
                      <View className="w-[180px] p-3 justify-center">
                        <Text className="text-muted text-sm">
                          {employee.email}
                        </Text>
                      </View>
                      <View className="w-[100px] p-3 justify-center">
                        <Text className="text-foreground text-sm">
                          {employee.role}
                        </Text>
                      </View>
                      <View className="w-[100px] p-3 justify-center">
                        <Text className="text-muted text-sm">
                          {employee.department || '-'}
                        </Text>
                      </View>
                      <View className="w-[100px] p-3 justify-center">
                        <Text className="text-muted text-sm">
                          {employee.phone || '-'}
                        </Text>
                      </View>
                      <View className="w-[100px] p-3 justify-center">
                        <Text className="text-primary font-bold text-sm">
                          {employee.salary.toLocaleString()} ETB
                        </Text>
                      </View>
                      <View className="w-[100px] p-3 justify-center">
                        <View className={
                          "px-3 py-1 rounded-full self-start " +
                          (employee.status === 'active' ? "bg-green-100" : "bg-red-100")
                        }>
                          <Text className={
                            "text-xs font-semibold " +
                            (employee.status === 'active' ? "text-green-800" : "text-red-800")
                          }>
                            {employee.status}
                          </Text>
                        </View>
                      </View>
                      <View className="w-[100px] p-3 justify-center">
                        <Text className="text-muted text-sm">
                          {employee.joinedDate}
                        </Text>
                      </View>
                      <View className="w-[200px] p-3 flex-row gap-2">
                        <TouchableOpacity
                          onPress={() => handleToggleStatus(employee)}
                          className="flex-1 bg-blue-500 rounded-md py-2 items-center"
                        >
                          <Text className="text-white text-xs font-semibold">
                            {employee.status === 'active' ? 'Deactivate' : 'Activate'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeleteEmployee(employee.id)}
                          className="flex-1 bg-red-500 rounded-md py-2 items-center"
                        >
                          <Text className="text-white text-xs font-semibold">Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
